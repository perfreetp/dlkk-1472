import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { PageLayout } from "@/components/layout/PageLayout";
import { Home } from "@/pages/Home";
import { Enterprise } from "@/pages/Enterprise";
import { License } from "@/pages/License";
import { Premises } from "@/pages/Premises";
import { Materials } from "@/pages/Materials";
import { Result } from "@/pages/Result";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<PageLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/enterprise" element={<Enterprise />} />
          <Route path="/license" element={<License />} />
          <Route path="/premises" element={<Premises />} />
          <Route path="/materials" element={<Materials />} />
          <Route path="/result" element={<Result />} />
        </Route>
      </Routes>
    </Router>
  );
}
