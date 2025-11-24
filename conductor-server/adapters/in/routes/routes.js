import path from 'path';
import { makeAuthRouter } from './authRoutes.js';

export function mountRoutes(app, container) {
  const { authController } = container;

  // root → login
  app.get('/', (req, res) => res.redirect('/auth/login'));

  app.use('/auth', makeAuthRouter({ authController: container.authController }));

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