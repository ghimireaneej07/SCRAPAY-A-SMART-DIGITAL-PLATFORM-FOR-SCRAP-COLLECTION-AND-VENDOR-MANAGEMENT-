# Scrapay Frontend

## Stack
- React + Vite
- Tailwind CSS
- React Router
- Framer Motion

## Setup
```powershell
cd scrapay-frontend
npm install
```

Create `.env`:
```env
VITE_API_BASE_URL=http://localhost:8000/api
```

Run:
```powershell
npm run dev
```

## Implemented flows
- JWT login/register with role-based routing
- User: category selection -> vendor selection -> order creation -> order details
- Vendor: pending orders -> order detail -> accept/reject/complete
- Admin: vendor verification + market rate creation
- Notifications: list + realtime websocket badge
