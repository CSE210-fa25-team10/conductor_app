/**
 * container.js is the composition root of the server. It is a pure wiring module, where all 
 * dependencies are assembled and stored. This is useful for a ports & adapters structure,
 * as well as preventing a nest of dependencies bouncing around the project.
 */

// import { makePgPool } from './pg.js';

// // REPOSITORIES
// import { makePgUserRepository } from '../adapters/out/db/PgUserRepository.js';
// import { makePgClassRepository } from '../adapters/out/db/PgClassRepository.js';

// // USE-CASES
// import { makeLoginUser } from '../app/usecases/loginUser.js';
// import { makeSearchClasses } from '../app/usecases/searchClasses.js';

// CONTROLLERS
import { makeAuthController } from '../controllers/authController.js';
// import { makeClassController } from '../adapters/in/http/ClassController.js';

// UTILITIES
// import { makePasswordHasher } from './passwordHasher.js';

export function buildContainer(config) {
//   //
//   // ---------------------
//   //  Infrastructure Layer
//   // ---------------------
//   //
//   const pool = makePgPool({
//     connectionString: config.DATABASE_URL
//   });

//   const passwordHasher = makePasswordHasher(); // some password hasher here


//   //
//   // ---------------------
//   //  Driven Adapters
//   //  (Repositories)
//   // ---------------------
//   //
//   const userRepo = makePgUserRepository({ pool });
//   const classRepo = makePgClassRepository({ pool });


//   //
//   // ---------------------
//   //  Application Layer
//   //  (Use Cases)
//   // ---------------------
//   //
//   const loginUser = makeLoginUser({ userRepo, passwordHasher });
//   const searchClasses = makeSearchClasses({ classQueryRepo: classRepo });


  //
  // ---------------------
  //  Driving Adapters
  //  (Controllers)
  // ---------------------
  //
//   const authController = makeAuthController({ loginUser });
  const authController = makeAuthController({  });
//   const classController = makeClassController({ searchClasses });


//   //
//   // Return precise object
//   //
//   return Object.freeze({
//     pool,                // in case server wants to close it
//     authController,
//     classController,
//     loginUser,
//     searchClasses,
//   });

  return Object.freeze({
    // pool,                // in case server wants to close it
    authController,
    // classController,
    // loginUser,
    // searchClasses,
  });
}