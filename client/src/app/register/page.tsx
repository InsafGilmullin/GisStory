import RegisterForm from '../components/RegisterForm';

export default function RegisterPage() {
  return (
    <main className="container mx-auto p-4 flex justify-center items-center h-screen">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4 text-center">Регистрация</h1>
        <RegisterForm />
      </div>
    </main>
  );
}