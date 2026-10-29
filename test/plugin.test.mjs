// dsh-rail-x — 契约测试（零依赖，node --test）
//
// 这个插件没有宿主逻辑，全部行为都在一条 CSS 加一个自愈观察器里。
// 所以测试不是「点一下看看」，而是把这些必须成立的契约钉住：
// 样式规则的具体属性、注入的幂等性、以及 package.json 声明的入口文件真实存在。

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, resolve } from 'node:path'
import { Script } from 'node:vm'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const read = (p) => readFileSync(resolve(ROOT, p), 'utf8')
const pkg = JSON.parse(read('package.json'))
const clientSrc = read(pkg.exports['./client'])
const hostSrc = read(pkg.exports['.'])

test('package.json 声明的入口文件都存在', () => {
  for (const rel of [pkg.exports['.'], pkg.exports['./client'], pkg.main, pkg.dsh.bundle.patch]) {
    assert.ok(existsSync(resolve(ROOT, rel)), `缺少 ${rel}`)
  }
})

test('客户端入口能被解析（classic script，语法合法，不执行）', () => {
  assert.doesNotThrow(() => new Script(clientSrc))
})

test('宿主入口能被真实导入，导出 apply / inject / name', async () => {
  const mod = await import(pathToFileURL(resolve(ROOT, pkg.exports['.'])).href)
  assert.equal(typeof mod.apply, 'function')
  assert.equal(typeof mod.name, 'string')
  assert.deepEqual([...mod.inject], [])
})

test('客户端以 classic script 方式注册，id 与包名一致', () => {
  assert.match(clientSrc, /window\.__ModuleLoader__\.load\(/)
  assert.match(clientSrc, /id:\s*"dsh-rail-x"/)
})

test('样式表 id 固定，注入前先查重（幂等）', () => {
  const styleId = clientSrc.match(/const STYLE_ID = "([^"]+)"/)?.[1]
  assert.equal(styleId, 'dsh-rail-x-style')
  assert.match(clientSrc, /if \(document\.getElementById\(STYLE_ID\) !== null\) return/)
  assert.match(clientSrc, /document\.getElementById\(STYLE_ID\) === null\) boot\(\)/)
})

test('删除按钮规则：常显 + 可点击 + 光标', () => {
  const rule = clientSrc
    .split('\n')
    .find((l) => l.includes('[class$="_remove"]{'))
  assert.ok(rule, '没有找到删除按钮的样式规则')
  assert.match(rule, /opacity:\s*\.\d+ !important/)
  assert.match(rule, /pointer-events:\s*auto !important/)
  assert.match(rule, /cursor:\s*pointer !important/)
})

test('hover 放大反馈存在，且只作用于 hover', () => {
  const hover = clientSrc.split('\n').find((l) => l.includes('[class$="_remove"]:hover'))
  assert.ok(hover, '没有 hover 规则')
  assert.match(hover, /transform:\s*scale\([^)]+\)/)
})

test('观察器监听 head，样式被移除后会自动补回（自愈）', () => {
  assert.match(clientSrc, /new MutationObserver/)
  assert.match(clientSrc, /observe\(document\.head,\s*\{\s*childList:\s*true\s*\}\)/)
})

test('宿主入口导出 cordis 需要的三件套，且 apply 是空实现不抛错', () => {
  assert.match(hostSrc, /export \{ apply, inject, name \}/)
  assert.match(hostSrc, /const inject = \[\]/)
  assert.match(hostSrc, /function apply\(/)
})

test('客户端不注入网络请求、不读 storage（纯样式补丁）', () => {
  for (const forbidden of ['fetch(', 'XMLHttpRequest', 'localStorage', 'sessionStorage', 'eval(']) {
    assert.ok(!clientSrc.includes(forbidden), `客户端不应出现 ${forbidden}`)
  }
})

test('client 声明与 cordis patch 一致', () => {
  assert.equal(pkg.dsh.client.platform, 'web')
  assert.equal(pkg.dsh.client.immediately, true)
  assert.deepEqual(pkg.dsh.client.inject, [])
  assert.equal(pkg.dsh.bundle.patch, './cordis.patch.yml')
  assert.match(read('cordis.patch.yml'), /name:\s*dsh-rail-x/)
})
