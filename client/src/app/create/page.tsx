// client/src/app/create/page.tsx

import CreateStoryForm from '../components/CreateStoryForm';

export default function CreateStoryPage() {
  return (
    <main className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Добавить новую историю</h1>
      <CreateStoryForm />
    </main>
  );
}