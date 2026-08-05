import { useMemo, useState, useEffect } from "react"
import { invoke } from "@/lib/electron"

function Greeting() {
  const [name, setName] = useState("")

  useEffect(() => {
    const cached = localStorage.getItem("chibangarx:user")
    if (cached) {
      setName(cached)
    } else {
      invoke({ channel: "get-user-name" })
        .then((username) => {
          if (username) {
            setName(username)
            localStorage.setItem("chibangarx:user", username)
          }
        })
        .catch((err) => {
          console.error("Error fetching user name:", err)
        })
    }
  }, [])

  const generalGreetings = ["Olá", "Bem-vindo", "Boas", "Saudações"]

  const timeGreetings = () => {
    const hour = new Date().getHours()
    if (hour < 12) return ["Bom dia"]
    if (hour < 18) return ["Boa tarde"]
    return ["Boa noite"]
  }

  const randomGreeting = useMemo(() => {
    const allGreetings = [...generalGreetings, ...timeGreetings()]
    return allGreetings[Math.floor(Math.random() * allGreetings.length)]
  }, [])

  return (
    <h1 className="text-2xl font-bold mb-4">
      {randomGreeting},{" "}
      <span className="bg-linear-to-r from-chibangarx-primary to-chibangarx-secondary bg-clip-text text-transparent">
         {name || "amigo"}
      </span>
    </h1>
  )
}

export default Greeting
