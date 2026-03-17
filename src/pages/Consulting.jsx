import { useState } from 'react'
import './Page.css'
import './Consulting.css'

const services = [
  { title: 'Coin Identification', desc: 'Get expert help identifying unknown coins in your collection.' },
  { title: 'Collection Advice', desc: 'Guidance on building, organising, and preserving your collection.' },
  { title: 'Valuation Guidance', desc: 'Understand the market value of your coins and banknotes.' },
  { title: 'Auction & Selling Advice', desc: 'Tips for selling through auctions or private sales.' },
  { title: 'Grading Advice', desc: 'Learn about condition and professional grading standards.' },
  { title: 'Authentication', desc: 'Help verifying authenticity of coins and banknotes.' },
]

const consultants = [
  {
    id: 'gary-willicott',
    name: 'Gary Willicott',
    image: '/consultants/gary-willicott.png',
    bio: "Gary Willicott is a South African Mint-approved coin dealer, trusted and registered with the South African Association of Numismatic Dealers (SAAND). He is the CEO of Investment Coin & Bullion, based in Cape Town. Gary currently holds the role of Vice President of both the South African Coin Collectors Club (SACCC) and the Western Cape Numismatic Society (WCNS). As a coin dealer, he places a strong focus on offering modern bullion, investment-grade coins, and newly released, trending collectible coins and bullion from around the world. He assists collectors at all levels, from those who wish to build retirement funds or generational wealth to new collectors looking to acquire lower-cost circulation coins so that they can enjoy the passion of completing sets, which is the foundation of the coin-collecting hobby. If you are looking for expert advice on modern coins and bullion in South Africa, Gary is an excellent person to speak to, combining knowledge, integrity, and a genuine passion for the hobby.",
  },
  {
    id: 'landon-coleske',
    name: 'Landon Coleske',
    image: '/consultants/landon-coleske.png',
    bio: "Landon Coleske is a prominent South African numismatic expert and historian at Bassani Auction House, specialising in rare and historically significant coinage. Working daily with some of the rarest coins in South Africa, Landon has exceptional insight into both the historical significance of numismatic material and the latest trends shaping the local market. His hands-on experience at the highest level of the industry makes his knowledge invaluable to collectors of all levels. Beyond the auction floor, Landon is also the creator of Landon History, where he shares engaging numismatic content with over 230,000 followers on TikTok—educating and inspiring a new generation of collectors. From history and rarity to valuation and market dynamics, Landon offers a well-rounded and deeply informed perspective. Whether you are starting out or refining a high-level collection, he provides guidance that is both practical and insightful. For collectors seeking clarity, knowledge, and confidence in South African numismatics, Landon is an exceptional guide on the journey.",
  },
  {
    id: 'werner-lamprecht',
    name: 'Werner Lamprecht',
    image: '/consultants/werner-lamprecht.png',
    bio: "Werner Lamprecht, owner of The Coin Guy and a registered dealer with the South African Association of Numismatic Dealers (SAAND), is one of South Africa's most respected and knowledgeable numismatists. He is widely regarded as a leading authority on Zuid-Afrikaansche Republiek (ZAR) coinage, with particular expertise in the Veldpond series. His deep understanding of rarity, provenance, and quality has positioned him as a trusted advisor to many of South Africa's top collectors. Werner also possesses exceptional expertise in coin grading, offering collectors valuable insight into identifying, acquiring, and upgrading top-tier numismatic specimens. Whether you are building a high-quality collection, seeking expert grading guidance, or looking to better understand the South African numismatic landscape, Werner provides clarity, precision, and experience at the highest level. He has assisted in the formation of several world-class collections - making him an invaluable guide for collectors striving for excellence.",
  },
  {
    id: 'john-hamer',
    name: 'John Hammer',
    image: '/consultants/john-hamer.png',
    bio: "John Hammer is the owner of JWH Coins and a registered dealer with the South African Association of Numismatic Dealers (SAAND), bringing both credibility and experience to the South African numismatic community. With a strong foundation in bullion and a deep passion for numismatic education, John is particularly well positioned to guide collectors who are looking to grow their collections while making sound, value-driven decisions. His approach combines practical market insight with a genuine enthusiasm for the hobby, making him a trusted resource for both new and experienced collectors alike. John has a unique ability to simplify complex numismatic concepts and communicate them in a way that is accessible, engaging, and meaningful. He is passionate about helping people appreciate not only the historical and collectible value of coins, but also their role in bullion ownership, wealth preservation, and long-term stewardship. Through his work, John aims to build bridges between collecting, education, and sound financial thinking, helping more South Africans engage with numismatics in a way that is both rewarding and purposeful. For collectors seeking to grow in knowledge, confidence, and appreciation for the hobby, John offers both guidance and perspective on the numismatic journey.",
  },
  {
    id: 'thomas-van-der-spuy',
    name: 'Thomas van der Spuy',
    image: '/consultants/thomas-van-der-spuy.png',
    bio: "Thomas van der Spuy is a passionate numismatist, entrepreneur, and the founder of the South African Coin Collectors Club (SACCC), an initiative dedicated to growing and strengthening the numismatic community across South Africa. With decades of collecting experience, Thomas has built a deep understanding of South African numismatics, with a particular focus on Zuid-Afrikaansche Republiek (ZAR) coinage in mint state condition. His journey spans from early collecting to assembling high-quality, investment-grade collections, giving him a well-rounded perspective on both the historical and financial aspects of the hobby. Beyond collecting, Thomas is actively involved in advancing numismatics through innovation, education, and community-building. His vision for SACCC is to create an accessible and welcoming platform for new and aspiring collectors, while also developing funding opportunities to support the long-term growth of the hobby in South Africa. Thomas is deeply committed to helping collectors make informed decisions—whether it's building meaningful collections, understanding value, or navigating the evolving numismatic landscape. For those looking to enter the hobby, refine their collections, or connect with the broader numismatic community, Thomas offers both strategic insight and a genuine passion for the journey.",
  },
  {
    id: 'anthony-govender',
    name: 'Anthony Govender',
    image: '/consultants/anthony-govender.png',
    bio: "Anthony Govender, widely known as The Coinnoisseur, is one of the most prominent and respected figures in South African numismatics. A lifelong numismatist, Anthony has dedicated his career to the study, education, and advancement of the hobby. With an exceptional depth of knowledge across all areas of South African numismatics, Anthony is widely regarded as one of the most knowledgeable experts in the field. From historical context and rarity to market trends and valuation, his understanding of coins is both comprehensive and unmatched. Over the years, Anthony has guided and advised many of South Africa's most prominent collectors, playing a key role in shaping some of the country's finest collections. His longstanding involvement - and now heading the Durban Coin Club - further reflects his commitment to fostering knowledge and community within the hobby. Anthony's passion for numismatics is driven by a desire to educate, inspire, and elevate collectors at every level. His insight is particularly valuable to discerning collectors and investors seeking to navigate rare and high-value numismatic material with confidence. For those serious about South African numismatics, having access to Anthony's knowledge and perspective is truly invaluable.",
  },
  {
    id: 'jan-kleynhans',
    name: 'Jan Kleynhans',
    image: '/consultants/jan-kleynhans.png',
    bio: "Jan Kleynhans is a name synonymous with South African numismatics and a highly respected figure within the collecting community. As the owner of Nomisma, Jan hosts weekly Nomisma coin auctions, catering to collectors of all levels across South Africa. He is also the founder of the well-known Ou Muntstukke Facebook group, where he has played a pivotal role in educating and guiding collectors nationwide. Renowned for his deep expertise in the Union of South Africa coin series, Jan is widely regarded as one of the leading authorities in this field. In addition, he is considered a foremost expert in coin conservation, with a level of practical knowledge and experience that is unmatched in South Africa. Jan's passion for numismatics is evident in his tireless commitment to helping others. Over the years, he has guided and mentored countless collectors - earning a reputation as the most influential educator in the hobby. Whether you are beginning your journey or refining an advanced collection, Jan offers a rare combination of knowledge, experience, and genuine willingness to help - making him one of the most valuable allies any collector can have.",
  },
  {
    id: 'dario-deligiannidis',
    name: 'Dario Deligiannidis',
    image: '/consultants/dario-deligiannidis.png',
    bio: "Dario Deligiannidis is the owner of the South African Numismatic Grading Services (SANGS) and operates within a SAAND-affiliated framework, bringing a high level of credibility and professionalism to coin grading in South Africa. With extensive expertise in grading - particularly within South African numismatics - Dario has developed a deep understanding of grading standards, market trends, and the significant role grading plays in both preserving and enhancing the value of a collection. He provides collectors with clear, strategic guidance on what to grade, when to grade, and how grading can unlock additional value while protecting important numismatic assets for the long term. Whether you are refining an existing collection or building a grading strategy from the ground up, Dario offers practical, insight-driven advice tailored to the South African market. For collectors looking to elevate, protect, and maximise the value of their collections, Dario is an invaluable resource.",
  },
  {
    id: 'dillon-bassani',
    name: 'Dillon Bassani',
    image: '/consultants/dillon-bassani.png',
    bio: "Dillon Bassani of Bassani Auction House is a leading figure in South African numismatics, which is widely regarded as South Africa's largest and most active numismatic dealer. Through daily auctions hosted on their app, Dillon and his team handle a constant flow of exceptional numismatic material - ranging from entry-level collectibles to some of the rarest and most important coins in South Africa. This unique position places him at the very centre of the market, working closely with many of the country's leading collectors and consistently engaging in high-level numismatic transactions. Dillon's knowledge of South African numismatics is both extensive and highly practical, shaped by real-time market experience. He has developed a deep understanding of rarity, pricing, demand, and collector behaviour - making his insight invaluable to both new and seasoned collectors. As a key figure helping to shape the modern numismatic landscape in South Africa, Dillon offers guidance that is current, strategic, and grounded in the realities of today's market. Whether you are entering the hobby, building a serious collection, or navigating high-value acquisitions, Dillon can be one of your greatest assets - providing clarity, confidence, and direction on your numismatic journey.",
  },
]

export default function Consulting() {
  const [selectedConsultant, setSelectedConsultant] = useState('')
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    const fd = new FormData(e.target)
    const entry = {
      id: Date.now().toString(),
      submittedAt: new Date().toISOString(),
      name: fd.get('name') || '',
      email: fd.get('email') || '',
      phone: fd.get('phone') || '',
      consultant: fd.get('consultant') || '',
      type: fd.get('type') || '',
      contactMethod: fd.get('contactMethod') || '',
      message: fd.get('message') || '',
    }
    const existing = JSON.parse(localStorage.getItem('wccc_consulting') || '[]')
    localStorage.setItem('wccc_consulting', JSON.stringify([entry, ...existing]))
    setSubmitted(true)
  }

  return (
    <main className="page consulting-page">
      <section className="page-hero">
        <h1>Consulting Services</h1>
        <p>Expert guidance for collectors</p>
      </section>
      <section className="page-content">
        <div className="container">
          <div className="consulting-intro">
            <p>
              Our experienced collectors and numismatic experts are passionate about helping fellow members. Consulting fees are treated as sponsorship contributions that support the club's mission while advancing numismatic knowledge in South Africa.
            </p>
            <p className="consulting-price-note">R1,500 donation for 30 minutes</p>
          </div>

          <section className="consultants-section">
            <h2>Our Consultants</h2>
            <div className="consultants-grid">
              {consultants.map((c) => (
                <article key={c.id} className="consultant-card">
                  <div className="consultant-image-wrap">
                    <img src={c.image} alt={c.name} className="consultant-image" />
                  </div>
                  <div className="consultant-info">
                    <h3>{c.name}</h3>
                    <p className="consultant-bio">{c.bio}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <div className="services-grid">
            {services.map((s, i) => (
              <div key={i} className="service-card">
                <span className="service-icon">◎</span>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>

          <hr className="consulting-separator" />
          <div className="consulting-form-wrap">
            <h2>Request a Consultation</h2>
            {submitted ? (
              <p style={{ fontSize: '1.1rem', color: 'var(--sa-green)', textAlign: 'center', padding: '2rem 0' }}>
                Thank you! Your consultation request has been received. We will be in touch shortly.
              </p>
            ) : (
            <form className="consulting-form" onSubmit={handleSubmit}>
              <div className="form-row">
                <label>
                  <span>Name <span className="required">*</span></span>
                  <input type="text" name="name" required />
                </label>
                <label>
                  <span>Email <span className="required">*</span></span>
                  <input type="email" name="email" required />
                </label>
              </div>
              <div className="form-row">
                <label>
                  <span>Phone <span className="required">*</span></span>
                  <input type="tel" name="phone" required />
                </label>
                <label>
                  <span>Consultant <span className="required">*</span></span>
                  <select
                    name="consultant"
                    required
                    value={selectedConsultant}
                    onChange={(e) => setSelectedConsultant(e.target.value)}
                  >
                    <option value="">Select a consultant</option>
                    {consultants.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="form-row">
                <label>
                  Type of consulting
                  <select name="type">
                    <option>General</option>
                    <option>Coin Identification</option>
                    <option>Collection Advice</option>
                    <option>Valuation</option>
                    <option>Auction / Selling</option>
                    <option>Grading</option>
                    <option>Authentication</option>
                  </select>
                </label>
                <label>
                  Preferred contact method
                  <select name="contactMethod">
                    <option>Email</option>
                    <option>Phone</option>
                    <option>WhatsApp</option>
                  </select>
                </label>
              </div>
              <label>
                Message (optional)
                <textarea name="message" rows={4} placeholder="Describe your enquiry..."></textarea>
              </label>
              <button type="submit" className="btn btn-primary">Submit Request</button>
            </form>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}
