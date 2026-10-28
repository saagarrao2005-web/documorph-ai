This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Python file conversion

The file converter sends DOCX and TXT uploads directly from the browser to the FastAPI service. The Python service returns the converted PDF for download; the Next.js app does not need a conversion API route.

Deploy the `backend` folder as a Python ASGI service with `main:app` as the application. Configure these environment variables:

- In Vercel, set `NEXT_PUBLIC_PYTHON_BACKEND_URL` to the backend's base URL, with no trailing slash. Redeploy after changing it.
- In the Python service, set `DOCUMORPH_ALLOWED_ORIGINS` to the exact website origin, such as `https://your-domain.vercel.app`. For multiple origins, separate them with commas. `http://localhost:3000` is allowed by default for local development.

The current Python converter supports `.docx` and `.txt` files to PDF. Other format conversions and document size reduction are not implemented by this backend yet.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
