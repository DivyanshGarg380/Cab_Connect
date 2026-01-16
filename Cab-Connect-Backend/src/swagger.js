import swaggerJSDoc from "swagger-jsdoc";

const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Cab Connect API",
      version: "1.0.0",
    },
    servers: [{ url: "http://localhost:5000" }],
  },

  apis: ["./src/**/*.js"],
});

export default swaggerSpec;
