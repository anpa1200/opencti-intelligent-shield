// @ts-check
// `@type` JSDoc annotations allow editor autocompletion and type checking
// (when paired with `@ts-check`).
// There are various equivalent ways to declare your Docusaurus config.
// See: https://docusaurus.io/docs/api/docusaurus-config

import {themes as prismThemes} from 'prism-react-renderer';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const siteDir = fileURLToPath(new URL('.', import.meta.url));
const landingPageSources = new Map([
  ['https://1200km.com/opencti-intelligent-shield/', 'src/pages/index.js'],
]);

function readGitDate(sourcePath) {
  try {
    const date = execFileSync(
      'git',
      ['log', '-1', '--format=%cs', '--', sourcePath],
      {cwd: siteDir, encoding: 'utf8'},
    ).trim();
    return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : undefined;
  } catch {
    return undefined;
  }
}

async function addLandingPageLastmod({defaultCreateSitemapItems, ...params}) {
  const items = await defaultCreateSitemapItems(params);
  return items.map((item) => {
    const sourcePath = landingPageSources.get(item.url);
    if (!sourcePath || item.lastmod) return item;
    const lastmod = readGitDate(sourcePath);
    return lastmod ? {...item, lastmod} : item;
  });
}

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: '1200km',
  tagline: 'OpenCTI STIX 2.1 deployment, AI enrichment, ATT&CK mapping, and secure CTI workflows',
  favicon: 'img/logo.png',

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  // Set the production url of your site here
  url: 'https://1200km.com',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/opencti-intelligent-shield/',

  scripts: [{src: 'https://1200km.com/assets/docusaurus-ecosystem.js?v=20260614-3', defer: true}],
  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'anpa1200',
  projectName: 'opencti-intelligent-shield',

  onBrokenLinks: 'throw',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: './sidebars.js',
          editUrl:
            'https://github.com/anpa1200/opencti-intelligent-shield/tree/main/docs-site/',
          showLastUpdateTime: true,
        },
        blog: false,
        sitemap: {
          lastmod: 'date',
          createSitemapItems: addLandingPageLastmod,
        },
        theme: {
          customCss: './src/css/custom.css',
        },
        gtag: {
          trackingID: 'G-TMTG21RVHM',
          anonymizeIP: true,
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      // Replace with your project's social card
      image: 'img/article/01-1-yZJrYF0KW4x5gzDg6xNN6A.png',
      metadata: [
        {
          property: 'og:site_name',
          content: '1200km — Andrey Pautov Security Research',
        },
        {
          name: 'description',
          content: 'The Intelligent Shield is a practical OpenCTI AI CTI platform guide covering STIX 2.1 deployment, feeds, Claude AI enrichment, ATT&CK mapping, security hardening, and investigation workflows.',
        },
        {
          name: 'keywords',
          content: 'OpenCTI, threat intelligence platform, STIX 2.1, AI enrichment, Claude AI connector, IOC enrichment, confidence scoring, OpenCTI deployment, Docker Compose, threat intelligence automation',
        },
      ],
      colorMode: {
        defaultMode: 'dark',
        disableSwitch: false,
        respectPrefersColorScheme: false,
      },
      navbar: {
        title: 'The Intelligent Shield',
        logo: {
          alt: 'The Intelligent Shield',
          src: 'img/logo.png',
        },
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'tutorialSidebar',
            position: 'left',
            label: 'Guide',
          },
          {
            href: 'https://github.com/anpa1200/opencti-intelligent-shield',
            label: 'GitHub',
            position: 'right',
          },        {
          label: 'Projects',
          position: 'right',
          items: [
            {label: 'CTI Analyst Field Manual', href: 'https://1200km.com/cti-analyst-field-manual/'},
            {label: 'CTI as a Code', href: 'https://1200km.com/CTI_as_a_Code/'},
            {label: 'Operation Desert Hydra', href: 'https://1200km.com/operation-desert-hydra/'},
            {label: 'Customer-Driven AI CTI', href: 'https://1200km.com/customer-driven-ai-cti-project/'},
            {label: 'Israel Threat Actors CTI', href: 'https://1200km.com/israel-government-threat-actors-cti/'},
            {label: 'AI vs Defense', href: 'https://1200km.com/ai-vs-defense/'},
            {label: 'HexStrike AI (upstream project)', href: 'https://github.com/0x4m4/hexstrike-ai'},
          ],
        },
          {
            href: 'https://1200km.com/',
            label: 'Main Page',
            position: 'right',
            className: 'navbar-portfolio-btn',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Ecosystem',
            items: [
              {label: 'CTI Analyst Field Manual', href: 'https://1200km.com/cti-analyst-field-manual/'},
              {label: 'CTI as a Code', href: 'https://1200km.com/CTI_as_a_Code/'},
              {label: 'Operation Desert Hydra', href: 'https://1200km.com/operation-desert-hydra/'},
              {label: 'Customer-Driven AI CTI', href: 'https://1200km.com/customer-driven-ai-cti-project/'},
              {label: 'Israel Threat Actors CTI', href: 'https://1200km.com/israel-government-threat-actors-cti/'},
              {label: 'AI vs Defense', href: 'https://1200km.com/ai-vs-defense/'},
              {label: 'HexStrike AI (upstream project)', href: 'https://github.com/0x4m4/hexstrike-ai'},
            ],
          },
          {
            title: 'Author',
            items: [
              {label: 'Medium', href: 'https://medium.com/@1200km'},
              {label: 'GitHub', href: 'https://github.com/anpa1200'},
              {label: 'LinkedIn', href: 'https://www.linkedin.com/in/andrey-pautov/'},
              {label: 'Main Page', href: 'https://1200km.com/'},
            ],
          },
          {
            title: 'Docs',
            items: [
              {
                label: 'Intelligent Shield',
                to: '/docs/intelligent-shield',
              },
            ],
          },
          {
            title: 'Project',
            items: [
              {
                label: 'Medium Article',
                href: 'https://medium.com/@1200km/the-intelligent-shield-057c9b4b9394',
              },
              {
                label: 'Source',
                href: 'https://github.com/anpa1200/opencti-intelligent-shield',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} Andrey Pautov. Built with Docusaurus.`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
      },
    }),
};

export default config;
