import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAdminCollection } from '../../hooks/useAdminCollection';

const emptyForm = {
  foodId: '',
  restaurantId: '',
};

const AdminRestaurantFoods = () => {
  const {
    createItem,
    deleteItem,
    error,
    items: relations,
    loading,
    submitting,
  } = useAdminCollection('restaurantFoods', 'restaurantName');
  const { items: restaurants, loading: restaurantsLoading } = useAdminCollection('restaurants');
  const { items: foods, loading: foodsLoading } = useAdminCollection('foods');
  const [form, setForm] = useState(emptyForm);

  const selectedRestaurant = useMemo(
    () => restaurants.find((restaurant) => restaurant.id === form.restaurantId),
    [form.restaurantId, restaurants]
  );
  const selectedFood = useMemo(
    () => foods.find((food) => food.id === form.foodId),
    [foods, form.foodId]
  );

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!selectedRestaurant || !selectedFood) {
      return;
    }

    await createItem({
      foodId: selectedFood.id,
      foodName: selectedFood.name || selectedFood.id,
      restaurantId: selectedRestaurant.id,
      restaurantName: selectedRestaurant.name || selectedRestaurant.id,
    });

    setForm(emptyForm);
  };

  const handleDelete = async (relation) => {
    if (window.confirm(`${relation.restaurantName || relation.restaurantId} - ${relation.foodName || relation.foodId} ilişkisi silinsin mi?`)) {
      await deleteItem(relation.id);
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium text-emerald-700">Admin / Restaurant Foods</p>
          <h1 className="mt-2 text-2xl font-bold text-slate-950">Restoran-Lezzet İlişkileri</h1>
          <p className="mt-2 text-sm text-slate-600">
            Bir restoranın hangi yöresel lezzetleri sunduğunu restaurantFoods collection ile yönet.
          </p>
        </div>
        <Link className="text-sm font-medium text-red-700 hover:text-red-900" to="/admin">
          Admin panele dön
        </Link>
      </div>

      <form className="grid gap-4 rounded border bg-white p-5 md:grid-cols-2" onSubmit={handleSubmit}>
        <label className="text-sm font-medium text-slate-700">
          Restoran
          <select
            className="mt-1 w-full rounded border px-3 py-2"
            disabled={restaurantsLoading}
            name="restaurantId"
            onChange={handleChange}
            required
            value={form.restaurantId}
          >
            <option value="">Restoran seç</option>
            {restaurants.map((restaurant) => (
              <option key={restaurant.id} value={restaurant.id}>
                {restaurant.name || restaurant.id}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-medium text-slate-700">
          Lezzet
          <select
            className="mt-1 w-full rounded border px-3 py-2"
            disabled={foodsLoading}
            name="foodId"
            onChange={handleChange}
            required
            value={form.foodId}
          >
            <option value="">Lezzet seç</option>
            {foods.map((food) => (
              <option key={food.id} value={food.id}>
                {food.name || food.id}
              </option>
            ))}
          </select>
        </label>

        <div className="md:col-span-2">
          <button className="rounded bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-60" disabled={submitting} type="submit">
            {submitting ? 'Kaydediliyor...' : 'İlişki Ekle'}
          </button>
        </div>
      </form>

      {error && <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error.message}</p>}
      {loading && <p className="rounded border border-dashed bg-white p-4 text-sm text-slate-500">İlişkiler yükleniyor...</p>}
      {!loading && !relations.length && (
        <p className="rounded border border-dashed bg-white p-4 text-sm text-slate-500">
          Henüz restoran-lezzet ilişkisi yok.
        </p>
      )}

      <div className="overflow-hidden rounded border bg-white">
        <div className="grid grid-cols-[1fr_1fr_auto] gap-3 border-b bg-slate-50 px-4 py-3 text-xs font-semibold uppercase text-slate-500">
          <span>Restoran</span>
          <span>Lezzet</span>
          <span>Islem</span>
        </div>
        {relations.map((relation) => (
          <div className="grid grid-cols-[1fr_1fr_auto] gap-3 border-b px-4 py-3 text-sm last:border-b-0" key={relation.id}>
            <span className="font-medium text-slate-900">{relation.restaurantName || relation.restaurantId}</span>
            <span className="text-slate-600">{relation.foodName || relation.foodId}</span>
            <button
              className="rounded border border-red-200 px-3 py-1 text-xs text-red-700"
              onClick={() => handleDelete(relation)}
              type="button"
            >
              Sil
            </button>
          </div>
        ))}
      </div>
    </section>
  );
};

export default AdminRestaurantFoods;
