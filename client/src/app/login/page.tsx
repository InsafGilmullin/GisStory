import LoginForm from '../components/LoginForm';

export default function LoginPage() {
  return (
    <main className="container mx-auto p-4 flex justify-center items-center h-screen">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4 text-center">Вход</h1>
        <LoginForm />
      </div>
    </main>
  );
}