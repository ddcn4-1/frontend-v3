#!/usr/bin/env node

/**
 * Simple Turborepo Remote Cache Server using AWS S3
 *
 * This server implements the Turborepo Remote Cache API:
 * - GET /v8/artifacts/:hash - Fetch artifact from S3
 * - PUT /v8/artifacts/:hash - Upload artifact to S3
 * - POST /v8/artifacts/events - Record cache events (no-op)
 * - GET /v8/artifacts/status - Check caching status
 */

import http from 'http';
import { S3Client, GetObjectCommand, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';

const PORT = process.env.PORT || 8080;
const AWS_REGION = process.env.AWS_REGION || 'ap-northeast-2';
const S3_BUCKET = process.env.S3_BUCKET || `turbo-cache-${AWS_REGION}`;

// Initialize S3 client
const s3Client = new S3Client({ region: AWS_REGION });

console.log(`Starting Turbo S3 Cache Server...`);
console.log(`Region: ${AWS_REGION}`);
console.log(`Bucket: ${S3_BUCKET}`);
console.log(`Port: ${PORT}`);

const server = http.createServer(async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, POST, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);
  const path = url.pathname;

  console.log(`${req.method} ${path}`);

  try {
    // GET /v8/artifacts/:hash - Fetch artifact
    if (req.method === 'GET' && path.match(/^\/v8\/artifacts\/[a-f0-9]+$/)) {
      const hash = path.split('/').pop();
      const key = `artifacts/${hash}`;

      try {
        const command = new GetObjectCommand({
          Bucket: S3_BUCKET,
          Key: key,
        });

        const response = await s3Client.send(command);

        res.writeHead(200, {
          'Content-Type': 'application/octet-stream',
          'x-artifact-duration': '0',
          'x-artifact-tag': 'cache-hit',
        });

        // Stream S3 object to response
        response.Body.pipe(res);
        console.log(`✅ Cache HIT: ${hash}`);
      } catch (error) {
        if (error.name === 'NoSuchKey') {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Artifact not found' }));
          console.log(`❌ Cache MISS: ${hash}`);
        } else {
          throw error;
        }
      }
      return;
    }

    // HEAD /v8/artifacts/:hash - Check if artifact exists
    if (req.method === 'HEAD' && path.match(/^\/v8\/artifacts\/[a-f0-9]+$/)) {
      const hash = path.split('/').pop();
      const key = `artifacts/${hash}`;

      try {
        await s3Client.send(new HeadObjectCommand({
          Bucket: S3_BUCKET,
          Key: key,
        }));

        res.writeHead(200);
        res.end();
        console.log(`✅ Artifact exists: ${hash}`);
      } catch (error) {
        if (error.name === 'NotFound') {
          res.writeHead(404);
          res.end();
          console.log(`❌ Artifact not found: ${hash}`);
        } else {
          throw error;
        }
      }
      return;
    }

    // PUT /v8/artifacts/:hash - Upload artifact
    if (req.method === 'PUT' && path.match(/^\/v8\/artifacts\/[a-f0-9]+$/)) {
      const hash = path.split('/').pop();
      const key = `artifacts/${hash}`;

      // Collect request body
      const chunks = [];
      for await (const chunk of req) {
        chunks.push(chunk);
      }
      const body = Buffer.concat(chunks);

      // Upload to S3
      await s3Client.send(new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
        Body: body,
        ContentType: 'application/octet-stream',
      }));

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        urls: [`https://${S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${key}`]
      }));
      console.log(`✅ Artifact uploaded: ${hash} (${body.length} bytes)`);
      return;
    }

    // POST /v8/artifacts/events - Record cache events (no-op)
    if (req.method === 'POST' && path === '/v8/artifacts/events') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));
      return;
    }

    // GET /v8/artifacts/status - Check caching status
    if (req.method === 'GET' && path === '/v8/artifacts/status') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'enabled',
        bucket: S3_BUCKET,
        region: AWS_REGION
      }));
      return;
    }

    // Unknown route
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  } catch (error) {
    console.error('Error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: error.message }));
  }
});

server.listen(PORT, () => {
  console.log(`🚀 Turbo S3 Cache Server running on http://localhost:${PORT}`);
  console.log(`📦 S3 Bucket: s3://${S3_BUCKET}`);
  console.log(`🌍 Region: ${AWS_REGION}`);
});
