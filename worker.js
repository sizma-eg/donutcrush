export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: corsHeaders
      });
    }

    try {
      // GET /api/products
      if (
        url.pathname === "/api/products" &&
        request.method === "GET"
      ) {
        const { results } = await env.DB
          .prepare(`
            SELECT *
            FROM products
            WHERE available = 1
            ORDER BY id DESC
          `)
          .all();

        return Response.json(
          {
            success: true,
            products: results
          },
          {
            headers: corsHeaders
          }
        );
      }

      // POST /api/products
      if (
        url.pathname === "/api/products" &&
        request.method === "POST"
      ) {
        const data = await request.json();

        if (!data.name || data.price === undefined) {
          return Response.json(
            {
              success: false,
              error: "Name and price are required"
            },
            {
              status: 400,
              headers: corsHeaders
            }
          );
        }

        const result = await env.DB
          .prepare(`
            INSERT INTO products
            (name, description, price, image_url, category, available)
            VALUES (?, ?, ?, ?, ?, ?)
          `)
          .bind(
            data.name,
            data.description || "",
            Number(data.price),
            data.image_url || "",
            data.category || "",
            data.available === false ? 0 : 1
          )
          .run();

        return Response.json(
          {
            success: true,
            id: result.meta.last_row_id
          },
          {
            status: 201,
            headers: corsHeaders
          }
        );
      }

      // DELETE /api/products/:id
      const match = url.pathname.match(
        /^\/api\/products\/(\d+)$/
      );

      if (match && request.method === "DELETE") {
        const id = Number(match[1]);

        await env.DB
          .prepare("DELETE FROM products WHERE id = ?")
          .bind(id)
          .run();

        return Response.json(
          {
            success: true
          },
          {
            headers: corsHeaders
          }
        );
      }

      return Response.json(
        {
          success: false,
          error: "Route not found"
        },
        {
          status: 404,
          headers: corsHeaders
        }
      );

    } catch (error) {
      return Response.json(
        {
          success: false,
          error: error.message
        },
        {
          status: 500,
          headers: corsHeaders
        }
      );
    }
  }
};
