export const environment = {
    production: false,
    baseUrl: 'http://localhost:3000',
    // Ruta específica para autenticación (Register/Login)
    authApi: 'http://localhost:3000/api/auth',
    // Ruta para gestión de usuarios (CRUD)
    usersApi: 'http://localhost:3000/api/users',

    stripePublicKey: 'pk_test_51TF59VK1qKH77YTduyJn44BruhEDaWGDisu6ry0DtNKZwiTnFGyMysighKG4gecGIdX4TSFc66sike4gZoJ1xCXA008uHnREBG',
    checkoutApi: 'http://localhost:3000/api/auth/create-checkout-session'
};