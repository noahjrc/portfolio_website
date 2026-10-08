import { albums, experience, profile, projects } from '@/data/content';

/**
 * Everything in the 3D room as plain HTML: read by screen readers and search
 * engines, and shown directly to browsers without WebGL.
 */
export default function PlainContent() {
  return (
    <div className="plain-content">
      <section>
        <h2>About</h2>
        <p>{profile.bio}</p>
        <p>{profile.education}</p>
      </section>
      <section>
        <h2>Experience</h2>
        {experience.map((e) => (
          <article key={e.company}>
            <h3>
              {e.role}, {e.company}
            </h3>
            <p>
              {e.location} · {e.dates}
            </p>
            <p>Skills: {e.skills.join(', ')}</p>
            <ul>
              {e.bullets.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>
      <section>
        <h2>Projects</h2>
        {projects.map((p) => (
          <article key={p.title}>
            <h3>
              {p.title} ({p.kind})
            </h3>
            <p>Skills: {p.stack.join(', ')}</p>
            <ul>
              {p.steps.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>
      <section>
        <h2>Interests</h2>
        <p>
          Music and a large vinyl collection, cooking (particularly Italian), staying active, and video games, including
          retro FPGA gaming. Some favourite records:
        </p>
        <ul>
          {albums.map((a) => (
            <li key={a.coverImage}>
              {a.title} by {a.artist}
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2>Résumé and contact</h2>
        <p>
          <a href={profile.resume}>Download my résumé (PDF)</a>
        </p>
        <p>
          Email: <a href={`mailto:${profile.email}`}>{profile.email}</a>
        </p>
        <p>
          <a href={profile.github}>GitHub</a> · <a href={profile.linkedin}>LinkedIn</a>
        </p>
      </section>
    </div>
  );
}
