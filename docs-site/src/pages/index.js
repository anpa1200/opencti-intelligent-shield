import clsx from 'clsx';
import Head from '@docusaurus/Head';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import styles from './index.module.css';

const breadcrumbStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      name: '1200km',
      item: 'https://1200km.com/',
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'The Intelligent Shield',
      item: 'https://1200km.com/opencti-intelligent-shield/',
    },
  ],
};

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero', styles.heroBanner)}>
      <div className={styles.heroOverlay} />
      <div className={clsx('container', styles.heroContent)}>
        <Heading as="h1" className="hero__title">
          The Intelligent Shield
        </Heading>
        <p className={clsx('hero__subtitle', styles.subtitle)}>
          {siteConfig.tagline}
        </p>
        <p className={styles.lede}>
          A practical OpenCTI deployment guide for turning fragmented threat
          intelligence into enriched, scored, and actionable CTI with Claude.
        </p>
        <div className={styles.buttons}>
          <Link
            className="button button--primary button--lg"
            to="/docs/intelligent-shield">
            Read the guide
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function Home() {
  const pageTitle = 'The Intelligent Shield | 1200km';
  const pageDescription = 'Build an analyst-reviewed OpenCTI workflow with STIX 2.1, trusted feeds, Claude enrichment, ATT&CK mapping, security hardening, and practical investigations.';
  return (
    <Layout
      title="The Intelligent Shield"
      description={pageDescription}>
      <Head>
        <meta property="og:site_name" content="1200km — Andrey Pautov Security Research" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbStructuredData)}
        </script>
      </Head>
      <HomepageHeader />
      <main className={styles.main}>
        <section className="container">
          <div className={styles.grid}>
            <article>
              <h2>Beyond ingestion</h2>
              <p>
                The project combines OpenCTI, threat intelligence connectors,
                and a custom Claude enrichment connector to summarize reports,
                map ATT&CK techniques, and improve analyst context.
              </p>
            </article>
            <article>
              <h2>Included repository</h2>
              <p>
                The root of this repository contains the Docker Compose stack,
                connector source, deployment guide, and the Docusaurus version
                of the published Medium article.
              </p>
            </article>
          </div>
        </section>
      </main>
    </Layout>
  );
}
