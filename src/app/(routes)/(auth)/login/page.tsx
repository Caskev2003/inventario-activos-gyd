import Link from 'next/link'
import React from 'react'
import { LoginForm } from './loginForm';
import { Navbar } from './components/Navbar';

export default async function page() {
    
  return (
    <div>
        <div>
        <Navbar/>
        </div>
        <p className='text-3xl font-bold text-left mb-7 text-[#20232d]'>INICIAR SESIÓN</p>
        <LoginForm/>

    </div>
  );
}
