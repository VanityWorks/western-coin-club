import './Page.css'
import './About.css'

export default function About() {
  return (
    <main className="page about-page">
      <section className="page-hero">
        <h1>About the South African Coin Collectors Club</h1>
        <p>South Africa's premier community for numismatic enthusiasts</p>
      </section>
      <section className="page-content">
        <div className="container">
          <div className="about-grid">
            <div className="about-block">
              <h2>Our Mission</h2>
              <p>
                The South African Coin Collectors Club exists to bring together collectors, researchers, and enthusiasts 
                of coins, banknotes, medals, and tokens. We foster education, facilitate networking, 
                and celebrate the rich numismatic heritage of South Africa and beyond.
              </p>
            </div>
            <div className="about-block">
              <h2>What We Do</h2>
              <p>
                We host regular events, publish educational content, provide consulting services for 
                identification and valuation, and maintain an active community forum. Our members range 
                from beginners to seasoned collectors and professional dealers.
              </p>
            </div>
            <div className="about-block full">
              <h2>Our History</h2>
              <p>
                Founded by passionate collectors who saw the need for a modern, inclusive numismatic 
                community in South Africa, the South African Coin Collectors Club has grown into a vibrant organisation 
                that welcomes anyone with an interest in the art and history of money.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
