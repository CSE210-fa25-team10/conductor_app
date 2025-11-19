import path from 'path';
import {
  showLoginPage,
  googleLogin,
  callback,
  login,
  register,
  logout,
} from '../../../controllers/authController.js';
// import { requireAuth } from './requireAuth.js';

export function mountRoutes(app, container) {
  const { authController } = container;

  // root → login
  app.get('/', (req, res) => res.redirect('/login'));

  // login / logout
  app.get('/login', showLoginPage);
  app.post('/login', login);
  app.post('/logout', logout);

//   // instructor area (HTML pages)
//   app.get(
//     '/instructor',
//     requireAuth('instructor'),
//     (req, res) => {
//       res.sendFile(path.join(process.cwd(), 'frontend/instructor/dashboard.html'));
//     }
//   );

//   // student area
//   app.get(
//     '/student',
//     requireAuth('student'),
//     (req, res) => {
//       res.sendFile(path.join(process.cwd(), 'frontend/student/dashboard.html'));
//     }
//   );

//   // Example JSON APIs used *within* those pages
//   app.get('/api/courses', requireAuth(), container.courseController.list);
//   app.post('/api/courses', requireAuth('instructor'), container.courseController.create);
}