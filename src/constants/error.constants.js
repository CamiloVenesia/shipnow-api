// src/constants/error.constants.js

export const ERROR_CODES = {
    // Usuarios
    USER_NOT_FOUND: 'USER_NOT_FOUND',
    USER_ALREADY_EXIST: 'USER_ALREADY_EXIST',

    // Pedidos
    ORDER_NOT_FOUND: 'ORDER_NOT_FOUND',
    INVALID_ORDER_STATUS: 'INVALID_ORDER_STATUS',
    ORDER_ALREADY_DELIVERED: 'ORDER_ALREADY_DELIVERED',

    // Entregas
    DELIVERY_NOT_FOUND: 'DELIVERY_NOT_FOUND',
    DRIVER_UNAVAILABLE: 'DRIVER_UNAVAILABLE',

    // Productos
    PRODUCT_NOT_FOUND: 'PRODUCT_NOT_FOUND',
    INVALID_STOCK: 'INVALID_STOCK',

    // Mocks
    INVALID_MOCK_QUANTITY: 'INVALID_MOCK_QUANTITY',
    MOCK_GENERATION_FAILED: 'MOCK_GENERATION_FAILED',

    // Genéricos
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    FORBIDDEN: 'FORBIDDEN',
    DATABASE_ERROR: 'DATABASE_ERROR',
    INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR'
}

Object.freeze(ERROR_CODES)

export const ERROR_DICTIONARY = {
    // Usuarios
    [ERROR_CODES.USER_NOT_FOUND]: {
        statusCode: 404,
        message: 'Usuario no encontrado'
    },
    [ERROR_CODES.USER_ALREADY_EXIST]: {
        statusCode: 400,
        message: 'El usuario ya existe'
    },

    // Pedidos
    [ERROR_CODES.ORDER_NOT_FOUND]: {
        statusCode: 404,
        message: 'Pedido no encontrado'
    },
    [ERROR_CODES.INVALID_ORDER_STATUS]: {
        statusCode: 400,
        message: 'El estado del pedido no es válido'
    },
    [ERROR_CODES.ORDER_ALREADY_DELIVERED]: {
        statusCode: 409,
        message: 'El pedido ya fue entregado y no puede modificarse'
    },

    // Entregas
    [ERROR_CODES.DELIVERY_NOT_FOUND]: {
        statusCode: 404,
        message: 'Entrega no encontrada'
    },
    [ERROR_CODES.DRIVER_UNAVAILABLE]: {
        statusCode: 409,
        message: 'No hay repartidores disponibles en este momento'
    },

    // Productos
    [ERROR_CODES.PRODUCT_NOT_FOUND]: {
        statusCode: 404,
        message: 'Producto no encontrado'
    },
    [ERROR_CODES.INVALID_STOCK]: {
        statusCode: 400,
        message: 'El stock o precio no puede ser negativo'
    },

    // Mocks
    [ERROR_CODES.INVALID_MOCK_QUANTITY]: {
        statusCode: 400,
        message: 'La cantidad debe ser un número entero mayor a cero'
    },
    [ERROR_CODES.MOCK_GENERATION_FAILED]: {
        statusCode: 500,
        message: 'Ocurrió un error al generar o insertar los datos de prueba'
    },

    // Genéricos
    [ERROR_CODES.VALIDATION_ERROR]: {
        statusCode: 400,
        message: 'Faltan datos obligatorios'
    },
    [ERROR_CODES.FORBIDDEN]: {
        statusCode: 403,
        message: 'Acción no permitida'
    },
    [ERROR_CODES.DATABASE_ERROR]: {
        statusCode: 500,
        message: 'Error al interactuar con la base de datos'
    },
    [ERROR_CODES.INTERNAL_SERVER_ERROR]: {
        statusCode: 500,
        message: 'Error interno del servidor'
    }
}