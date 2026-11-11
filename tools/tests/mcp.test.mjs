import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { handleMessage, handleToolCall } from '../innerscape-mcp.mjs';

const server = fileURLToPath(new URL('../innerscape-mcp.mjs', import.meta.url));

// Launch the server exactly as the README's MCP config does, send lines, and
// return every stdout line once stdin closes.
function exchange(lines) {
  return new Promise((resolve, reject) => {
    const child = spawn('node', [server], { stdio: ['pipe', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => (stdout += d));
    child.stderr.on('data', (d) => (stderr += d));
    child.on('error', reject);
    child.on('close', (code) =>
      resolve({ code, stderr, lines: stdout.split('\n').filter(Boolean) }),
    );
    child.stdin.end(
      lines.map((l) => (typeof l === 'string' ? l : JSON.stringify(l))).join('\n') + '\n',
    );
  });
}

test('initialize reports the protocol and server name', () => {
  const reply = handleMessage({ jsonrpc: '2.0', id: 1, method: 'initialize' });
  assert.equal(reply.result.protocolVersion, '2024-11-05');
  assert.equal(reply.result.serverInfo.name, 'innerscape');
});

test('tools/list exposes the three tools with schemas', () => {
  const { tools } = handleMessage({ jsonrpc: '2.0', id: 2, method: 'tools/list' }).result;
  assert.deepEqual(
    tools.map((t) => t.name),
    ['innerscape_project_brief', 'innerscape_module_map', 'innerscape_planning_prompt'],
  );
  for (const t of tools) assert.equal(t.inputSchema.type, 'object');
});

test('tools/call returns the tool result as text content', () => {
  const reply = handleMessage({
    jsonrpc: '2.0',
    id: 3,
    method: 'tools/call',
    params: { name: 'innerscape_planning_prompt', arguments: { focus: 'sleep' } },
  });
  assert.equal(JSON.parse(reply.result.content[0].text).focus, 'sleep');
  assert.equal(handleToolCall('innerscape_module_map').modules.length, 5);
});

test('errors: unknown tool, unknown method, and notifications get no reply', () => {
  const unknownTool = handleMessage({
    jsonrpc: '2.0',
    id: 4,
    method: 'tools/call',
    params: { name: 'nope' },
  });
  assert.equal(unknownTool.error.code, -32602);
  const unknownMethod = handleMessage({ jsonrpc: '2.0', id: 5, method: 'nope' });
  assert.equal(unknownMethod.error.code, -32601);
  assert.equal(handleMessage({ jsonrpc: '2.0', method: 'notifications/initialized' }), null);
});

test('the documented launch writes only JSON-RPC on stdout', async () => {
  const { code, lines } = await exchange([
    { jsonrpc: '2.0', id: 1, method: 'initialize', params: {} },
    { jsonrpc: '2.0', method: 'notifications/initialized' },
    { jsonrpc: '2.0', id: 2, method: 'tools/list' },
    {
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: { name: 'innerscape_project_brief', arguments: {} },
    },
    'not json',
  ]);
  assert.equal(code, 0);
  assert.equal(lines.length, 4);
  const replies = lines.map((l) => JSON.parse(l));
  for (const r of replies) assert.equal(r.jsonrpc, '2.0');
  assert.deepEqual(
    replies.map((r) => r.id),
    [1, 2, 3, null],
  );
  assert.equal(replies[3].error.code, -32700);
});

test('importing the module does not start reading stdin', async () => {
  // If import started the server, this test process would hang on stdin.
  const mod = await import('../innerscape-mcp.mjs');
  assert.equal(typeof mod.serve, 'function');
});
