import { Request, Response, NextFunction } from "express";

interface DbError extends Error {
  code?: number;
  path?: string;
  errors?: Record<string, { message: string }>;
}

export const notFound = (req: Request, res: Response, next: NextFunction) => {
  res.status(404);
  next(new Error(`Route not found: ${req.originalUrl}`));
};

export const errorHandler = (
  err: DbError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let message = err.message;

  if (err.name === "ValidationError" && err.errors) {
    res.status(400);
    message = Object.values(err.errors).map((e) => e.message).join(", ");
  }

  if (err.name === "CastError") {
    res.status(400);
    message = `Invalid value for ${err.path}`;
  }

  if (err.code === 11000) {
    res.status(409);
    message = "This record already exists";
  }

  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    success: false,
    message,
  });
};
