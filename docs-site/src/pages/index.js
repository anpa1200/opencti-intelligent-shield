import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero', styles.heroBanner)}>
      <div className={styles.heroOverlay} />
      <div className={clsx('container', styles.heroContent)}>
        <Heading as="h1" className="hero__title">
          {siteConfig.title}
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
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title="OpenCTI AI Enrichment"
      description="Deploying AI-driven enrichment in OpenCTI with Claude and STIX 2.1.">
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
