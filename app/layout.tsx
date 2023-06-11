import Modal from "@/components/Modal"
import "./globals.css"

export const metadata = {
  title: "Modern Todo App",
  description:
    "It is a Modern Todo App with features like Drag & Drop, Search, Server Side Rendering and Appwrite Database",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-[#F5F6F8]">
        {children} <Modal />
      </body>
    </html>
  )
}
