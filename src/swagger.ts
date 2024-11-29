import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "WebSchool API",
      version: "1.0.0",
      description: "API documentation for WebSchool backend",
      contact: {
        name: "API Support",
        email: "support@webschool.com",
      },
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      {
        name: "Auth",
        description: "Authentication endpoints",
      },
      {
        name: "Users",
        description: "User management endpoints",
      },
      {
        name: "Classrooms",
        description: "Classroom management endpoints",
      },
      {
        name: "Games",
        description: "Game management endpoints",
      },
      {
        name: "Leaderboard",
        description: "Leaderboard management endpoints",
      },
    ],
  },
  apis: ["./src/routes/*.ts"],
};

export const specs = swaggerJsdoc(options);
