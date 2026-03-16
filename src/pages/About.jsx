import './Page.css'
import './About.css'

export default function About() {
  return (
    <main className="page about-page">
      <section className="page-hero">
        <h1>About the Club</h1>
        <p>A friendly, welcoming community for coin and banknote collectors across South Africa</p>
      </section>
      <section className="page-content">
        <div className="container">
          <div className="about-intro">
            <p>
              We're a welcoming national organisation that brings together collectors, researchers, dealers, and anyone 
              curious about coins and banknotes. Whether you've just found your first Krugerrand or you've been 
              collecting for decades, you're welcome here.
            </p>
          </div>
          <div className="about-grid">
            <div className="about-block">
              <h2>Why We Exist</h2>
              <p>
                The way collectors connect has changed. We use WhatsApp, Instagram, online auctions, and grading 
                services every day. But there wasn't a national hub that tied it all together. We're here to fix that-a 
                friendly space where collectors of all ages and experience levels can connect, learn, and grow the hobby together.
              </p>
            </div>
            <div className="about-block">
              <h2>What We Do</h2>
              <p>
                We run a WhatsApp community with channels for ZAR coins, Union coinage, banknotes, buy & sell, 
                and beginner questions. We host regional meetups in Cape Town, Johannesburg, Durban, and other 
                cities. We share educational content, help with identification and valuation, and put on national events. 
                It's all about making the world of coins accessible and fun.
              </p>
            </div>
            <div className="about-block">
              <h2>Our Vision</h2>
              <p>
                No stuffiness, no gatekeeping - just fun, thats our promise. Just a bunch of people who love coins and want to help others discover that too.
              </p>
            </div>
          </div>

          <div className="about-structure">
            <h2>Organisational Structure</h2>
            <p className="structure-intro">We're run by collectors, for collectors. Here's who keeps things moving:</p>

            <div className="structure-section">
              <h3>Executive Leadership</h3>
              <ul>
                <li><strong>President</strong> - Thomas van der Spuy</li>
                <li><strong>Vice President</strong> - Gary Willicott</li>
                <li><strong>Treasurer / Financial Director</strong> - Retief de Villiers</li>
                <li><strong>Legal & Governance Officer</strong> - Henk van Aswegen</li>
                <li><strong>Committee Members</strong> - Dillon Bassani, Dario Deligiannidis, Anthony Govender</li>
              </ul>
            </div>

            <div className="structure-section">
              <h3>Community & Industry Relations</h3>
              <ul>
                <li><strong>Membership Director</strong> - Georgia Hammer</li>
                <li><strong>Dealer & Industry Liaison</strong> - Dillon Bassani</li>
                <li><strong>Events Director</strong> - Dillon & Marco Bassani</li>
                <li><strong>Regional Coordinators</strong> - Cape Town (Gary Willicott), Johannesburg (Landon Coleske), Durban (Anthony Govender), Port Elizabeth (Jaco Krause), Bloemfontein (Juan Terblanche)</li>
              </ul>
            </div>

            <div className="structure-section">
              <h3>Research & Education</h3>
              <ul>
                <li><strong>Coin Research Director</strong> - To be announced</li>
                <li><strong>ZAR Series Coordinator</strong> - Werner Lamprecht</li>
                <li><strong>Union Series Coordinator</strong> - Jan Kleynhans</li>
                <li><strong>South African Decimal Series Coordinator</strong> - To be announced</li>
                <li><strong>World Coin Coordinator</strong> - To be announced</li>
                <li><strong>Ancient Coordinator</strong> - Joel Potgieter</li>
                <li><strong>Local Bullion & Mint Issues Coordinator</strong> - Marco Bassani</li>
                <li><strong>Banknotes Coordinator</strong> - To be announced</li>
                <li><strong>Tokens Coordinator</strong> - Anthony Govender</li>
                <li><strong>Young Collectors Program Director</strong> - John Hammer</li>
              </ul>
            </div>

            <div className="structure-section">
              <h3>Digital & Media</h3>
              <ul>
                <li><strong>Social Media Director</strong> - Landon Coleske</li>
                <li><strong>Content & Media Producer</strong> - Dev Rogers</li>
                <li><strong>Community Manager</strong> - Liz Devereux</li>
                <li><strong>Technology & Platform Manager</strong> - Jonathan Willicott</li>
              </ul>
            </div>

            <div className="structure-section structure-patron">
              <h3>Patron</h3>
              <p>To be announced</p>
            </div>
          </div>

          <div className="about-digital">
            <h2>Digital Community</h2>
            <p>At the heart of what we do is a WhatsApp Community-the main hub where collectors connect. Example channels include:</p>
            <ul className="channel-list">
              <li>General Discussions</li>
              <li>Research & Discoveries</li>
              <li>Ancient Coins</li>
              <li>ZAR Coinage</li>
              <li>Union Coinage</li>
              <li>Republic Decimal Coinage</li>
              <li>World Coins</li>
              <li>Banknotes</li>
              <li>Tokens & Medals</li>
              <li>Members Buy & Sell</li>
              <li>Coin Photography</li>
              <li>Grading & Authentication</li>
              <li>New Collectors / Beginner Questions</li>
            </ul>
            <p>This structure lets you focus on what you love while staying part of a national community-and helps new collectors feel welcome from day one.</p>
          </div>
        </div>
      </section>
    </main>
  )
}
