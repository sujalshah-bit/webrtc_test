import React from "react";
import { Link } from "react-router-dom";

const Nav = () => {
  return (
    <nav>
      <ul>
        <li>
          <Link to="/">Home</Link>
        </li>
        <li>
          <Link to="/test">test</Link>
        </li>
        <li>
          <Link to="/lobby">lobby</Link>
        </li>
        <li>
          <Link to="/calling">calling</Link>
        </li>
      </ul>
    </nav>
  );
};

export default Nav;
