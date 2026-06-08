export const environment = {
    production: true,
    baseUrl: 'https://htas-backend-node.onrender.com',

    // Ruta específica para autenticación (Register/Login)
    authApi: 'https://htas-backend-node.onrender.com/api/auth',

    // Ruta para gestión de usuarios (CRUD)
    usersApi: 'https://htas-backend-node.onrender.com/api/users',

    iaApi: 'https://htas-backend-node.onrender.com/api/ia',
    htasApi: 'https://htas-backend-node.onrender.com/api/htas',

    stripePublicKey: 'pk_test_51TF59VK1qKH77YTduyJn44BruhEDaWGDisu6ry0DtNKZwiTnFGyMysighKG4gecGIdX4TSFc66sike4gZoJ1xCXA008uHnREBG',
    checkoutApi: 'https://htas-backend-node.onrender.com/api/auth/create-checkout-session',
    recaptchaSiteKey: '6LdV0u8sAAAAAGK4Rkxxa98_h0eb2lUng2dv7RZa'
};