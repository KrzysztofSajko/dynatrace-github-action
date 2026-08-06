/*
Copyright 2024 Dynatrace LLC

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
*/

// Local-only smoke test against real Dynatrace tenants. Never run in CI -
// credentials are read from the local environment and must never be
// committed. See README.md > Local Development > Smoke Testing.

// eslint-disable-next-line import/extensions -- required for Node's native TypeScript execution
import * as dt from '../src/dynatrace.ts'

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable '${name}'`)
  }
  return value
}

async function scenario(name: string, run: () => Promise<void>): Promise<void> {
  console.log(`\n=== ${name} ===`)
  try {
    await run()
    console.log(`--- OK: ${name} ---`)
  } catch (error) {
    console.error(`--- FAILED: ${name} ---`)
    console.error(error)
    process.exitCode = 1
  }
}

async function main(): Promise<void> {
  const classicUrl = requireEnv('DT_CLASSIC_URL')
  const classicToken = requireEnv('DT_CLASSIC_TOKEN')
  const classicEntitySelector =
    process.env.DT_CLASSIC_ENTITY_SELECTOR ?? 'type(HOST)'

  const phase3Url = requireEnv('DT_PHASE3_URL')
  const phase3Token = requireEnv('DT_PHASE3_TOKEN')
  const phase3NodeFilter = process.env.DT_PHASE3_NODE_FILTER ?? 'type=="HOST"'

  await scenario(
    'classic tenant: entitySelector (regression check)',
    async () =>
      dt.sendEvents(classicUrl, classicToken, [
        {
          title: 'Smoke test: entitySelector',
          type: 'CUSTOM_INFO',
          entitySelector: classicEntitySelector,
          properties: { source: 'smoke-test' }
        }
      ])
  )

  await scenario('classic tenant: metric', async () =>
    dt.sendMetrics(classicUrl, classicToken, [
      { metric: 'github.smoke_test', value: '1.0' }
    ])
  )

  await scenario(
    'phase 3 tenant: entitySelector (expected to be a no-op / deprecated)',
    async () =>
      dt.sendEvents(phase3Url, phase3Token, [
        {
          title: 'Smoke test: entitySelector on Phase 3',
          type: 'CUSTOM_INFO',
          entitySelector: classicEntitySelector,
          properties: { source: 'smoke-test' }
        }
      ])
  )

  await scenario('phase 3 tenant: nodeSelectorFilter with matches', async () =>
    dt.sendEvents(phase3Url, phase3Token, [
      {
        title: 'Smoke test: nodeSelectorFilter match',
        type: 'CUSTOM_INFO',
        nodeSelectorFilter: phase3NodeFilter,
        properties: { source: 'smoke-test' }
      }
    ])
  )

  await scenario(
    'phase 3 tenant: nodeSelectorFilter with zero matches',
    async () =>
      dt.sendEvents(phase3Url, phase3Token, [
        {
          title: 'Smoke test: nodeSelectorFilter no match',
          type: 'CUSTOM_INFO',
          nodeSelectorFilter:
            'type=="HOST" and name=="definitely-does-not-exist-12345"',
          properties: { source: 'smoke-test' }
        }
      ])
  )

  console.log('\nAll scenarios ran. Cross-check the events in each tenant.')
}

try {
  await main()
} catch (error) {
  console.error(error)
  process.exitCode = 1
}
