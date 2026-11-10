import type { Metadata } from "next";
import { DiagnosticoFlow } from "@/components/assistant/DiagnosticoFlow";

export const metadata: Metadata = {
  title: "Diagnóstico",
  description: "Relate um desperdício de energia e descubra causas, soluções e o porquê de cada uma.",
};

export default function DiagnosticoPage() {
  return <DiagnosticoFlow />;
}
