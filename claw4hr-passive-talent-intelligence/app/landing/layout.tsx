import { Instrument_Serif } from "next/font/google"

const displayFont = Instrument_Serif({
  weight: "400",
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-display",
})

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <div className={displayFont.variable}>{children}</div>
}
