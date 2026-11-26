// README ke markers ke beech open-source contributions ki list likhta hai.
import { readFile, writeFile } from 'node:fs/promises'

const user = process.env.GH_USER || 'Huzaifa60'
const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'profile-readme' }
if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`

// Doosron ke public repos mein merge hui pull requests
const query = encodeURIComponent(`author:${user} type:pr is:merged is:public -user:${user}`)
const items = []
for (let page = 1; page <= 10; page++) {
  const res = await fetch(`https://api.github.com/search/issues?q=${query}&per_page=100&page=${page}`, { headers })
  if (!res.ok) throw new Error(`GitHub API ${res.status}: ${await res.text()}`)
  const data = await res.json()
  items.push(...data.items)
  if (data.items.length < 100) break
}

const repos = new Map()
for (const pr of items) {
  const name = pr.repository_url.split('/repos/')[1]
  repos.set(name, (repos.get(name) || 0) + 1)
}

const rows = [...repos]
  .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  .map(([name, count]) => {
    const link = `https://github.com/${name}/pulls?q=is%3Apr+is%3Amerged+author%3A${user}`
    return `| [**${name}**](https://github.com/${name}) | [${count}](${link}) |`
  })

const block = [
  '<div align="center">',
  '',
  `<img src="https://img.shields.io/badge/Merged_PRs-${items.length}-8957E5?style=for-the-badge&logo=github" alt="Merged pull requests" />`,
  `<img src="https://img.shields.io/badge/Repositories_Contributed-${repos.size}-2EA043?style=for-the-badge&logo=github" alt="Repositories contributed to" />`,
  '',
  '| Repository | Merged PRs |',
  '| :--- | :---: |',
  ...rows,
  '',
  '</div>',
].join('\n')

const readme = await readFile('README.md', 'utf8')
const markers = /(<!-- CONTRIBUTIONS:START -->)[\s\S]*?(<!-- CONTRIBUTIONS:END -->)/
if (!markers.test(readme)) throw new Error('README mein CONTRIBUTIONS markers nahi mile')
await writeFile('README.md', readme.replace(markers, (_, start, end) => `${start}\n${block}\n${end}`))
console.log(`${items.length} merged PRs, ${repos.size} repositories`)
