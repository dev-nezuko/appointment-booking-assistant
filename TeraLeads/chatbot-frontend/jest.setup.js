import '@testing-library/jest-dom'

// logout() assigns window.location.href; give it a plain object so the
// assignment can be asserted instead of triggering jsdom navigation.
delete window.location
window.location = { href: '' }
