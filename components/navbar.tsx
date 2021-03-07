function navItem(link, text, active) {
  return (
    <li className={"nav-item" + (active ? " active" : "")}>
      <a className="nav-link text-white" href={link}>
        <h5 className={"my-0" + (active ? " text-highlight" : "")}>{text}</h5>
      </a>
    </li>
  );
}

export default function Navbar(page) {
  return (
    <nav className="navbar navbar-expand navbar-dark bg-c-secondary">
      <div className="navbar-brand mb-0">
        <b>
          <h3 className="my-0">Watch Mega</h3>
        </b>
      </div>
      <ul className="navbar-nav mr-auto">
        {navItem("/", "Watch", page == "watch")}
        {navItem("/select", "Select", page == "select")}
        {navItem("/torrent", "Torrent", page == "torrent")}
      </ul>
    </nav>
  );
}

//   nav.navbar.navbar-expand.navbar-dark.bg-c-secondary
//     .navbar-brand.mb-0(href='#')
//       b
//         h3.my-0 Watch Mega
//     ul.navbar-nav.mr-auto
//       +navitem("/", "Watch", (tab == "watch"))
//       +navitem("/select", "Select", (tab == "select"))
//       +navitem("/torrent", "Torrent", (tab == "torrent"))
// if username
//   script(src="https://cdn.jsdelivr.net/npm/js-cookie@rc/dist/js.cookie.min.js")
//   script(src="./js/username.js")
//   script(src="socket.io/socket.io.js")
//   script(src="js/socket.js")
//   style
//     include ../public/css/username.css
//   div.col-6.col-lg-5.col-xl-4#username
//     button.px-4.bg-dark.text-light.username-field#username-btn
//       h5.my-0.text-truncate#username-btn-text
//     input.px-4.text-light.username-field#username-input(maxlength="30")
