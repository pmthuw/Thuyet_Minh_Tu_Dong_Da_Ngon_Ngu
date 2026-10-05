function Home() {
  return (
    <main className="home">
      <header className="navbar">
        <h2>VoiceMap</h2>

        <button className="language-btn">
          Tiếng Việt
        </button>
      </header>

      <section className="hero">
        <h1>
          Khám phá địa điểm
          <br />
          theo cách của bạn
        </h1>

        <p>
          VoiceMap cung cấp thuyết minh tự động
          bằng nhiều ngôn ngữ.
        </p>

        <button className="start-btn">
          Bắt đầu khám phá
        </button>
      </section>

      <section className="map-placeholder">
        <h2>Bản đồ</h2>
        <p>Bản đồ sẽ được tích hợp ở đây.</p>
      </section>
    </main>
  )
}

export default Home