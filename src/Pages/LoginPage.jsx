import { useState } from "react"


function LoginPage() {
    const [username, setusername] = useState('')
    const [password, setPassword] = useState('')

    const handleFormSubmit = (e) => {
        e.preventDefault();

    }

    return (
        <div className='min-h-screen w-full bg-black flex justify-center flex-col gap-10 sm:flex-row items-center  mx-10'>
            <div className="right-section flex justify-center items-center flex-col sm:flex-row md:flex-row  sm:flex-1 md:flex-1" >
                <img src="Logo.jpg"
                className="w-64 h-auto"
                />
                <p className="text-white font-semibold text- sm:text-xl md:text-2xl ">
                   Strength • Cardio • Conditioning 
                </p>
            </div>

            <div className="h-100 w-0.5 bg-white hidden  md:block ">
                
            </div>
            


            
            <div className="left-section flex justify-center items-center  sm:flex-1" >
                <form onSubmit={handleFormSubmit}
                className="bg-blue-500 w-full space-y-6 max-w-sm flex flex-col items-center justify-center"
                >
                    <div className="text-center">
                        <h1 className="text-white text-3xl font-bold mb-2">Welcome back</h1>
                        <p className="text-neutral-400 text-sm">Sign in to your account</p>
                    </div>

                    <div className="flex flex-col gap-3">
                        <div>
                        
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setusername(e.target.value)}
                                className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-transparent"
                                placeholder="you@example.com"
                                required
                            />
                        </div>

                        <div>
                           
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-transparent"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    <button
                    type="submit"
                    className="bg-green-600"
                    style={{padding:'10px'}}
                    >
                        Signin

                    </button>

                </form>

            </div>

        </div>
    )
}

export default LoginPage