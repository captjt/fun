import { Route, Routes } from "react-router-dom";

import { GameDetail } from "./pages/GameDetail";
import { Home } from "./pages/Home";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/games/:id" element={<GameDetail />} />
    </Routes>
  );
}

export default App;
