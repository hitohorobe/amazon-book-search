'use strict';

const https = require('https');
const fs = require('fs');
const path = require('path');

const AUTH_HOSTS = {
  '3.1': 'api.amazon.com',
  '3.2': 'api.amazon.co.uk',
  '3.3': 'api.amazon.co.jp',
};

const API_HOST = 'creatorsapi.amazon';
const API_BASE_PATH = '/catalog/v1';

function loadEnv(envPath) {
  const env = {};
  if (!fs.existsSync(envPath)) return env;
  const text = fs.readFileSync(envPath, 'utf8');
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

function postJson(hostname, pathName, headers, bodyObj) {
  const body = JSON.stringify(bodyObj);
  const options = {
    hostname,
    path: pathName,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body),
      ...headers,
    },
  };
  return new Promise((resolve, reject) => {
    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => (data += chunk));
      res.on('end', () => {
        let parsed;
        try {
          parsed = data ? JSON.parse(data) : {};
        } catch (e) {
          parsed = { raw: data };
        }
        resolve({ statusCode: res.statusCode, body: parsed });
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function camelizeKeys(obj) {
  const out = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) continue;
    const camel = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    out[camel] = value;
  }
  return out;
}

class CreatorsApiClient {
  constructor({ credentialId, credentialSecret, version, marketplace, partnerTag }) {
    this.credentialId = credentialId;
    this.credentialSecret = credentialSecret;
    this.version = version;
    this.marketplace = marketplace;
    this.partnerTag = partnerTag;
    this.authHost = AUTH_HOSTS[version];
    if (!this.authHost) {
      throw new Error(`Unknown Creators API version: ${version}`);
    }
    this._token = null;
    this._tokenExpiresAt = 0;
  }

  async _fetchToken() {
    const res = await postJson(this.authHost, '/auth/o2/token', {}, {
      grant_type: 'client_credentials',
      client_id: this.credentialId,
      client_secret: this.credentialSecret,
      scope: 'creatorsapi::default',
    });
    if (res.statusCode !== 200 || !res.body.access_token) {
      throw new Error(
        `Failed to obtain access token (HTTP ${res.statusCode}): ${JSON.stringify(res.body)}`
      );
    }
    this._token = res.body.access_token;
    this._tokenExpiresAt = Date.now() + (res.body.expires_in || 3600) * 1000 - 60000;
    return this._token;
  }

  async _getToken() {
    if (this._token && Date.now() < this._tokenExpiresAt) return this._token;
    return this._fetchToken();
  }

  async _request(operation, params) {
    const token = await this._getToken();
    const body = camelizeKeys({
      marketplace: this.marketplace,
      partner_tag: this.partnerTag,
      ...params,
    });
    const res = await postJson(
      API_HOST,
      `${API_BASE_PATH}/${operation}`,
      {
        Authorization: `Bearer ${token}`,
        'x-marketplace': this.marketplace,
      },
      body
    );
    return res;
  }

  getBrowseNodes({ browseNodeIds, resources }) {
    return this._request('getBrowseNodes', {
      browse_node_ids: browseNodeIds,
      ...(resources ? { resources } : {}),
    });
  }

  searchItems(params) {
    return this._request('searchItems', params);
  }
}

function createClientFromEnv(envPath) {
  const envFile = envPath || path.resolve(__dirname, '../../.env');
  const env = { ...loadEnv(envFile), ...process.env };
  const credentialId = env.AMAZON_CREATOR_API_ID;
  const credentialSecret = env.AMAZON_CREATOR_API_SECRET;
  const version = env.AMAZON_CREATOR_API_VERSION || '3.3';
  const partnerTag = env.AMAZON_TAG;
  const marketplace = env.AMAZON_MARKETPLACE || 'www.amazon.co.jp';

  if (!credentialId || !credentialSecret) {
    throw new Error(
      '.env に AMAZON_CREATOR_API_ID / AMAZON_CREATOR_API_SECRET が設定されていません。.env.example を参考に .env を作成してください。'
    );
  }

  return new CreatorsApiClient({ credentialId, credentialSecret, version, marketplace, partnerTag });
}

module.exports = { CreatorsApiClient, createClientFromEnv, loadEnv };
