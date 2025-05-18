'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { FaGithub, FaLinkedin, FaEnvelope, FaPhone } from 'react-icons/fa';

interface Album {
  title: string;
  artist: string;
  coverImage: string;
}

export default function Home() {
  const [flipped, setFlipped] = useState(Array(6).fill(false));
  const [showContact, setShowContact] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationText, setNotificationText] = useState('');

 const albums: Album[] = [
    { title: 'The Low End Theory', artist: 'A Tribe Called Quest', coverImage: '/the_low_end_theory.webp' },
    { title: 'Ants From Up There', artist: 'Black Country, New Road', coverImage: '/ants_from_up_there.webp' },
    { title: 'Discovery', artist: 'Daft Punk', coverImage: '/discovery.webp' },
    { title: 'The Rise and Fall of Ziggy Stardust and The Spiders From Mars', artist: 'David Bowie', coverImage: '/the_rise_and_fall_of_ziggy_stardust_and_the_spiders_from_mars.webp' },
    { title: 'The Money Store', artist: 'Death Grips', coverImage: '/black_white.jpg' },
    { title: "Storm of the Light's Bane", artist: 'Dissection', coverImage: '/storm_of_the_lights_bane.webp' },
    { title: 'Breath From Another', artist: 'Esthero', coverImage: '/breath_from_another.webp' },
    { title: 'When The Pawn...', artist: 'Fiona Apple', coverImage: '/when_the_pawn.webp' },
    { title: 'Lift Yr. Skinny Fists Like Antennas to Heaven!', artist: 'Godspeed You Black Emperor!', coverImage: '/lift_yr_skinny.webp' },
    { title: 'From Mars to Sirius', artist: 'Gojira', coverImage: '/from_mars_to_sirius.webp' },
    { title: 'By the Time I Get to Phoenix', artist: 'Injury Reserve', coverImage: '/by_the_time_i_get_to_phoenix.webp' },
    { title: 'Grace', artist: 'Jeff Buckley', coverImage: '/grace.webp' },
    { title: 'Veteran', artist: 'JPEGMAFIA', coverImage: '/veteran.webp' },
    { title: 'To Pimp a Butterfly', artist: '	Kendrick Lamar', coverImage: '/to_pimp_a_butterfly.webp' },
    { title: 'The Miseducation of Lauryn Hill', artist: 'Lauryn Hill', coverImage: '/the_miseducation_of_lauryn_hill.webp' },
    { title: 'Lil Uzi Vert vs. the World', artist: 'Lil Uzi Vert', coverImage: '/lil_uzi_vert_vs_the_world.webp' },
    { title: "Ride the Lightning", artist: 'Metallica', coverImage: '/ride_the_lightning.webp' },
    { title: "Madvillainy", artist: "MF DOOM/Madlib", coverImage: '/madvillainy.webp' },
    { title: 'Three Cheers for Sweet Revenge', artist: 'My Chemical Romance', coverImage: '/three_cheers_for_sweet_revenge.webp' },
    { title: 'Still Life', artist: 'Opeth', coverImage: '/still_life.webp' },
    { title: 'Wish You Were Here', artist: 'Pink Floyd', coverImage: '/wish_you_were_here.webp' },
    { title: 'In Rainbows', artist: 'Radiohead', coverImage: '/in_rainbows.webp' },
    { title: 'OK Computer', artist: 'Radiohead', coverImage: '/ok_computer.webp' },
    { title: 'The Magnolia Electric Co', artist: 'Songs: Ohia', coverImage: '/the_magnolia_electric_co.webp' },
    { title: 'Disintegration', artist: 'The Cure', coverImage: '/disintegration.webp' },
    { title: 'Things Fall Apart', artist: 'The Roots', coverImage: '/things_fall_apart.webp' },
    { title: 'Ignorance', artist: 'The Weather Station', coverImage: '/ignorance.webp' },
    { title: 'Titanic Rising', artist: 'Weyes Blood', coverImage: '/titanic_rising.webp' },
  ];
  const albumsPerPage = 5;
  const [currentIndex, setCurrentIndex] = useState(0);

  const visibleAlbums = Array.from({ length: albumsPerPage }, (_, i) =>
    albums[(currentIndex + i + albums.length) % albums.length]
  );

  const goPrev = () => setCurrentIndex(i => (i - 1 + albums.length) % albums.length);
  const goNext = () => setCurrentIndex(i => (i + 1) % albums.length);

  // Flip-card & contact handlers
  const toggleFlip = (idx: number) => {
    setFlipped(prev => {
      const copy = [...prev];
      copy[idx] = !copy[idx];
      return copy;
    });
  };
  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setNotificationText(`${type} copied to clipboard!`);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  return (
    <div className="page-container">
      {/* Header */}
      <header className="header fixed">
        <a
          href="#about"
          className="header_text"
          onClick={e => { e.preventDefault(); document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' }); }}
        >
          noahjrc
        </a>
        <div className="nav_container">
          <nav className="nav">
            {['Experience', 'Projects', 'Résumé'].map(item => (
              <a key={item} href={`#${item.toLowerCase()}`} className="nav-item">{item}</a>
            ))}
          </nav>
        </div>
        <div className="social_icons">
          <a href="https://github.com/noahjrc" target="_blank" rel="noopener noreferrer" className="icon-link">
            <FaGithub className="icon" />
          </a>
          <a href="https://www.linkedin.com/in/noah-colbourne/" target="_blank" rel="noopener noreferrer" className="icon-link">
            <FaLinkedin className="icon" />
          </a>
          <div className="contact-dropdown-container">
            <button onClick={() => setShowContact(!showContact)} className="icon-link" aria-label="Contact">
              <FaEnvelope className="icon" />
            </button>
            {showContact && (
              <div className="contact-dropdown">
                <div className="contact-item" onClick={() => copyToClipboard('njrcolbourne@mun.ca', 'Email')}>
                  <FaEnvelope className="icon" /><span>njrcolbourne@mun.ca</span>
                </div>
                <div className="contact-item" onClick={() => copyToClipboard('+1 (709) 567-3127', 'Phone')}>
                  <FaPhone className="icon" /><span>+1 (709) 567-3127</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Notification */}
      {showNotification && (
        <div className="contact-copy-notification show">
          {notificationText}
        </div>
      )}

      {/* About Me + Carousel */}
      <main className="about-me" id="about">
        <div className="content-wrapper">
          <div className="profile-image">
            <img src="/me.jpg" alt="Noah Colbourne" className="profile-photo" />
          </div>
          <div className="about-content">
            <div className="title-container">
              <h2 className="about-title">Noah Colbourne</h2>
            </div>
            <p className="about-text">I’m a Computer Engineering student at Memorial University of Newfoundland and Labrador (Class of 2026). I’ve worked in data science and recently expanded into web development through various projects, and more recently into app development, driven largely by my passion for music. Outside of tech, I collect vinyl (some favourites are featured below), enjoy cooking (especially Italian food), and spend my free time gaming or working out.</p>
          </div>
        </div>

        {/* Inline Album Carousel */}
        <div className="carousel-container">
          <div className="album-display">
            <button className="nav-button" onClick={goPrev}>{'\u276E'}</button>
            <div className="album-grid">
              {visibleAlbums.map(album => (
                <div key={album.title} className="album-cover-container">
                  <Image
                    src={album.coverImage}
                    alt={`${album.title} by ${album.artist}`}
                    width={200}
                    height={200}
                    className="album-cover"
                  />
                  <div className="album-overlay">
                    <h3 className="overlay-title">{album.title}</h3>
                    <p className="overlay-artist">{album.artist}</p>
                  </div>
                </div>
              ))}
            </div>
            <button className="nav-button" onClick={goNext}>{'\u276F'}</button>
          </div>
        </div>
      </main>

      {/* Experience */}
      <section className="experience" id="experience">
        <div className="content-wrapper">
          <h2 className="section-title">Experience</h2>
          
          {/* First two cards in 2x1 grid */}
          <div className="grid-container">
            <div className={`flip-card ${flipped[0] ? 'flipped' : ''}`} onClick={() => toggleFlip(0)}>
              <div className="flip-card-inner">
                <div className="flip-card-front image-wrapper">
                  <img src="/Cenovus.png" alt="Cenovus Energy" className="experience-image" />
                  <div className="overlay">
                    <h3>Cenovus Energy</h3>
                    <p className="dates">May 2024 – August 2024, January 2025 – April 2025</p>
                  </div>
                </div>
                <div className="flip-card-back">
                  <h3><strong>DCI Digitalization Engineering Student</strong></h3>
                  <ul>
                    <li>Automated the digitization of 1,600+ Mud Report and Bottomhole Assembly PDF/Excel files using Python, enhancing data accessibility and enabling streamlined dashboard development</li>
                    <li>Reworked a MATLAB-based downhole vibration model in Python, enabling large-scale training and analysis in Databricks using structured Bottomhole Assembly datasets</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className={`flip-card ${flipped[1] ? 'flipped' : ''}`} onClick={() => toggleFlip(1)}>
              <div className="flip-card-inner">
                <div className="flip-card-front image-wrapper">
                  <img src="/eSonar.jpg" alt="eSonar" className="experience-image" />
                  <div className="overlay">
                    <h3>eSonar</h3>
                    <p className="dates">January 2023 – April 2023</p>
                  </div>
                </div>
                <div className="flip-card-back">
                  <h3><strong>Electrical Engineering Product Development Intern</strong></h3>
                  <ul>
                    <li>Designed and implemented C firmware for wireless communication using UART and SPI protocols on Microchip MCUs, enabling integration with a marine mammal detection device</li>
                    <li>Configured Wi-Fi communication via an access point on the wireless board, enabling remote control of the marine mammal detection device from a laptop</li>
                    <li>Produced circuit diagrams in Eagle and collaborated on mechanical machining to support device prototyping</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          
          {/* Third card centered */}
          <div className="centered-card-container">
            <div className={`flip-card centered-card ${flipped[2] ? 'flipped' : ''}`} onClick={() => toggleFlip(2)}>
              <div className="flip-card-inner">
                <div className="flip-card-front image-wrapper">
                  <img src="/CNLOPB.jpg" alt="C-NLOPB" className="experience-image" />
                  <div className="overlay">
                    <h3>Canada-Newfoundland & Labrador<br />Offshore Petroleum Board</h3>
                    <p className="dates">May 2022 – August 2022</p>
                  </div>
                </div>
                <div className="flip-card-back">
                  <h3><strong>Junior Safety Engineering Student</strong></h3>
                  <ul>
                    <li>Managed and analyzed safety incident data within Synergi Life, enabling data-driven reporting and dashboard development for trend analysis</li>
                    <li>Led an introductory demonstration on Synergi Life for the safety team, introducing platform capabilities and workflows to enable independent usage for safety incident reporting and trend analysis</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Projects */}
      <section className="projects" id="projects">
        <div className="content-wrapper">
          <h2 className="section-title">Projects</h2>
          
          {/* First two cards in 2x1 grid */}
          <div className="grid-container">
            <div className={`flip-card ${flipped[3] ? 'flipped' : ''}`} onClick={() => toggleFlip(3)}>
              <div className="flip-card-inner">
                <div className="flip-card-front image-wrapper">
                  <img src="/Trip_Tailor.png" alt="Trip Tailor" className="experience-image" />
                  <div className="overlay">
                    <h3>Trip Tailor</h3>
                    <p className="dates">Go, React, PostgreSQL, OAuth2, Docker</p>
                  </div>
                </div>
                <div className="flip-card-back">
                  <h3><strong>Web App</strong></h3>
                  <ul>
                    <li>Developed a microservices-based platform for sharing and exploring travel itineraries, enhancing trip planning efficiency</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className={`flip-card ${flipped[4] ? 'flipped' : ''}`} onClick={() => toggleFlip(4)}>
              <div className="flip-card-inner">
                <div className="flip-card-front image-wrapper">
                  <img src="/Spell_Quest.png" alt="Spell Quest" className="experience-image" />
                  <div className="overlay">
                    <h3>Spell Quest</h3>
                    <p className="dates">Unity, C#</p>
                  </div>
                </div>
                <div className="flip-card-back">
                  <h3><strong>Unity Game</strong></h3>
                  <ul>
                    <li>Built a 2D game aimed at enhancing children's spelling skills through engaging, educational platformer mechanics</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          
          {/* Third card centered */}
          <div className="centered-card-container">
            <div className={`flip-card centered-card ${flipped[5] ? 'flipped' : ''}`} onClick={() => toggleFlip(5)}>
              <div className="flip-card-inner">
                <div className="flip-card-front image-wrapper">
                  <img src="/default.jpg" alt="Music Rating App" className="experience-image" />
                  <div className="overlay">
                    <h3>Music Rating App (Capstone)</h3>
                    <p className="dates">Dart, Flutter, MusicBrainz, AtProtocol</p>
                  </div>
                </div>
                <div className="flip-card-back">
                  <h3><strong>Mobile App</strong></h3>
                  <ul>
                    <li>Designing a music-focused mobile platform for album rating and real-time social interaction</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Resume */}
      <section className="resume" id="résumé">
        <div className="content-wrapper">
          <h2 className="section-title">Résumé</h2>
          <iframe 
            src="/SW_Resume.pdf" 
            className="resume-embed"
            title="Noah Colbourne's Resume"
          >
            This browser does not support PDFs. Please download the PDF to view it.
          </iframe>
          <a 
            href="/SW_Resume.pdf" 
            download="Noah_Colbourne_Resume.pdf" 
            className="download-btn"
          >
            Download PDF
          </a>
        </div>
      </section>
    </div>
  );
}