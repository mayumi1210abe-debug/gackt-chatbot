export async function POST() {
  return Response.json(
    { success: true },
    {
      headers: {
        "Set-Cookie": "admin_session=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax",
      },
    },
  );
}
