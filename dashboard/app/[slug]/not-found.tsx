/**
 * dashboard/app/[slug]/not-found.tsx
 * Shown when a slug has no assembled payload yet (AI pipeline still running
 * or slug does not exist).
 */
export default function PreviewNotFound() {
  return (
    <html lang="en">
      <head>
        <title>Preview Not Available</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#f8fafc' }}>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          textAlign: 'center',
        }}>
          <div style={{
            width: 72,
            height: 72,
            borderRadius: 16,
            background: '#1a6eb5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1.5rem',
          }}>
            <span style={{ fontSize: 36 }}>⏳</span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.75rem' }}>
            Preview Not Ready Yet
          </h1>
          <p style={{ color: '#64748b', maxWidth: 380, lineHeight: 1.6, marginBottom: '1.5rem' }}>
            The AI pipeline is still generating this landing page. This usually takes a few minutes.
            Please try again shortly.
          </p>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
            If this persists, check the campaign status in the dashboard.
          </p>
        </div>
      </body>
    </html>
  );
}
