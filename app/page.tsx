"use client";

import { SessionProvider, signIn, signOut, useSession } from "next-auth/react";
import Image from "next/image";


export default function Home() {
  return (
    <div>
      <SessionProvider>
        <RealHome />
      </SessionProvider>
    </div>
  );
}

function RealHome() {
  const Session = useSession();

  return (
    <div>
      {Session.status === "authenticated" && (
        <button onClick={() => signOut()}>Logout</button>
      )}
      {Session.status === "unauthenticated" && (
        <button onClick={() => signIn()}>SignIn</button>
      )}
    </div>
  );
}
