// @ts-check
// `@type` JSDoc annotations allow editor autocompletion and type checking
// (when paired with `@ts-check`).
// There are various equivalent ways to declare your Docusaurus config.
// See: https://docusaurus.io/docs/api/docusaurus-config

import {themes as prismThemes} from 'prism-react-renderer';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'The Intelligent Shield',
  tagline: 'Deploying AI-driven enrichment in OpenCTI',
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

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'anpa1200',
  projectName: 'opencti-intelligent-shield',

  headTags: [
    {
      tagName: 'script',
      attributes: {
        async: 'true',
        src: 'https://www.googletagmanager.com/gtag/js?id=G-TMTG21RVHM',
      },
    },
    {
      tagName: 'script',
      attributes: {},
      innerHTML: `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', 'G-TMTG21RVHM');
      `,
    },
  ],

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
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
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
          name: 'keywords',
          content: 'OpenCTI, threat intelligence platform, STIX 2.1, AI enrichment, Claude AI connector, IOC enrichment, confidence scoring, OpenCTI deployment, Docker Compose, threat intelligence automation',
        },
      ],
      colorMode: {
        respectPrefersColorScheme: true,
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
            {label: 'HexStrike AI', href: 'https://github.com/0x4m4/hexstrike-ai'},
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
              {label: 'HexStrike AI', href: 'https://github.com/0x4m4/hexstrike-ai'},
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
