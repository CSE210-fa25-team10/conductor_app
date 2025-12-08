/**
 * container.js is the composition root of the server. It is a pure wiring module, where all
 * dependencies are assembled and stored. This is useful for a ports & adapters structure,
 * as well as preventing a nest of dependencies bouncing around the project.
 */

// import { makePgPool } from './pg.js';

// // REPOSITORIES
import { pool } from '../db.js';

// // USE-CASES
// import { makeLoginUser } from '../app/usecases/loginUser.js';
// import { makeSearchClasses } from '../app/usecases/searchClasses.js';

// REPOSITORIES
import { makePgClassRepository } from '../adapters/out/db/PgClassRepository.js';

// SERVICES
import { makeCourseService } from '../services/courseService.js';

// CONTROLLERS
import { makeAuthController } from '../controllers/authController.js';
import { makeQueryController } from '../controllers/queryController.js';
import { makeAttendanceController } from '../controllers/attendanceController.js';
import { makeStandUpController } from '../controllers/standupController.js';
import { makeCourseController } from '../controllers/courseController.js';
// import { makeClassController } from '../adapters/in/http/ClassController.js';

// UTILITIES
// import { makePasswordHasher } from './passwordHasher.js';

export function buildContainer() {
  //   //
  //   // ---------------------
  //   //  Infrastructure Layer
  //   // ---------------------
  //   //
  //   const pool = makePgPool({
  //     connectionString: config.DATABASE_URL
  //   });

  //   const passwordHasher = makePasswordHasher(); // some password hasher here

  //
  // ---------------------
  //  Driven Adapters
  //  (Repositories)
  // ---------------------
  const classRepository = makePgClassRepository({ pool });
  const queryController = makeQueryController({ pool });

  //
  // ---------------------
  //  Application Layer
  //  (Services)
  // ---------------------
  //
  const courseService = makeCourseService({ classRepository });

  //
  // ---------------------
  //  Application Layer
  //  (Use Cases)
  // ---------------------
  //
  //   const loginUser = makeLoginUser({ userRepo, passwordHasher });
  //   const searchClasses = makeSearchClasses({ classQueryRepo: classRepo });

  //
  // ---------------------
  //  Driving Adapters
  //  (Controllers)
  // ---------------------
  //
  const authController = makeAuthController();
  const attendanceController = makeAttendanceController({});
  const standupController = makeStandUpController({});
  const courseController = makeCourseController({ courseService });
  //   const authController = makeAuthController({ loginUser });
  //   const classController = makeClassController({ searchClasses });

  //
  // Return precise object
  //
  return Object.freeze({
    pool, // in case server wants to close it
    queryController,
    authController,
    attendanceController,
    standupController,
    courseController,
    // classController,
    // loginUser,
    // searchClasses,
  });
}