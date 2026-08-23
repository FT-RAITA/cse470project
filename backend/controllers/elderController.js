import Elder from "../models/elder.js";
import ShiftCoverage from "../models/shiftCoverage.js";

const populateCoverage = (query) =>
  query
    .populate("elder", "fullName elderID")
    .populate("originalCaregiver", "name email")
    .populate({ path: "swapRequest", select: "handoverLog" });

const startOfDay = (at) => {
  const d = new Date(at);
  d.setHours(0, 0, 0, 0);
  return d;
};

const endOfDay = (at) => {
  const d = new Date(at);
  d.setHours(23, 59, 59, 999);
  return d;
};


// Generate Elder ID
const generateElderID = async () => {
  for (;;) {
    const elderID = `ELD-${Math.floor(100000 + Math.random() * 900000)}`;

    const exists = await Elder.exists({ elderID });

    if (!exists) {
      return elderID;
    }
  }
};


// Check caregiver
const assertCaregiver = (req, res) => {
  if (req.user?.role !== "caregiver") {
    res.status(403).json({
      message: "Only caregivers can manage elder profiles.",
    });

    return false;
  }

  return true;
};


// ===============================
// GET ALL ELDERS
// ===============================

export const getAllElders = async (req, res) => {
  try {
    const caregiverId = req.user.id;

    // -----------------------------------------
    // 1. Get the caregiver's own elders
    // -----------------------------------------

    const ownElders = await Elder.find({
      caregiver: caregiverId,
    })
      .sort({ createdAt: -1 })
      .lean();


    // -----------------------------------------
    // 2. Get elders temporarily assigned
    //    through an accepted caregiver swap
    // -----------------------------------------

    const now = new Date();

    const coverage = await ShiftCoverage.find({
      coveringCaregiver: caregiverId,

      startAt: {
        $lte: now,
      },

      endAt: {
        $gte: now,
      },
    })
      .populate(
        "elder",
        "fullName elderID age gender bloodGroup phone address medicalHistory allergies chronicDiseases emergencyContacts nutritionPlan"
      )
      .populate(
        "originalCaregiver",
        "name email"
      )
      .lean();


    // -----------------------------------------
    // 3. Convert covered elders into the same
    //    format expected by ElderCard
    // -----------------------------------------

    const temporaryElders = coverage
      .filter((item) => item.elder)
      .map((item) => ({
        ...item.elder,

        isTemporary: true,

        coveredFrom: item.originalCaregiver,

        coverageWindow: {
          startAt: item.startAt,
          endAt: item.endAt,
        },

        coverageId: item._id,
      }));


    // -----------------------------------------
    // 4. Return own + temporary elders
    // -----------------------------------------

    return res.json([
      ...ownElders,
      ...temporaryElders,
    ]);

  } catch (error) {

    console.error(
      "GET ALL ELDERS ERROR:",
      error
    );

    return res.status(500).json({
      message: error.message,
    });
  }
};


// ===============================
// GET ONE ELDER
// ===============================

export const getElderById = async (req, res) => {
  try {

    if (!assertCaregiver(req, res)) return;

    const elder = await Elder.findOne({
      _id: req.params.id,
      caregiver: req.user._id,
    }).lean();

    if (!elder) {
      return res.status(404).json({
        message: "Elder not found",
      });
    }

    return res.status(200).json(elder);

  } catch (error) {

    console.error("GET ELDER ERROR:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid elder ID.",
      });
    }

    return res.status(500).json({
      message: error.message,
    });
  }
};


// ===============================
// CREATE ELDER
// ===============================

export const createElder = async (req, res) => {
  try {

    if (!assertCaregiver(req, res)) return;

    const {
      fullName,
      age,
      dateOfBirth,
      gender,
      bloodGroup,
      phone,
      address,
      medicalHistory,
      allergies,
      chronicDiseases,
      emergencyContacts,
      nutritionPlan,
    } = req.body;


    if (!fullName?.trim()) {
      return res.status(400).json({
        message: "Full name is required.",
      });
    }


    const elder = await Elder.create({

      caregiver: req.user._id,

      elderID: await generateElderID(),

      fullName: fullName.trim(),

      age,

      dateOfBirth: dateOfBirth || undefined,

      gender: gender || undefined,

      bloodGroup: bloodGroup || undefined,

      phone,

      address,

      medicalHistory:
        Array.isArray(medicalHistory)
          ? medicalHistory
          : [],

      allergies:
        Array.isArray(allergies)
          ? allergies
          : [],

      chronicDiseases:
        Array.isArray(chronicDiseases)
          ? chronicDiseases
          : [],

      emergencyContacts:
        Array.isArray(emergencyContacts)
          ? emergencyContacts
          : [],

      nutritionPlan:
        nutritionPlan || undefined,
    });


    return res.status(201).json(elder);

  } catch (error) {

    console.error("CREATE ELDER ERROR:", error);


    if (error.code === 11000) {

      return res.status(409).json({
        message:
          "Could not generate a unique Elder ID. Please try again.",
      });

    }


    if (error.name === "ValidationError") {

      return res.status(400).json({
        message: error.message,
      });

    }


    return res.status(500).json({
      message: error.message,
    });
  }
};


// ===============================
// UPDATE ELDER
// ===============================

export const updateElder = async (req, res) => {
  try {

    if (!assertCaregiver(req, res)) return;


    const allowedFields = [

      "fullName",

      "age",

      "dateOfBirth",

      "gender",

      "bloodGroup",

      "phone",

      "address",

      "medicalHistory",

      "allergies",

      "chronicDiseases",

      "emergencyContacts",

      "nutritionPlan",

    ];


    const updates = {};


    for (const field of allowedFields) {

      if (
        Object.prototype.hasOwnProperty.call(
          req.body,
          field
        )
      ) {

        updates[field] = req.body[field];

      }

    }


    if (updates.fullName !== undefined) {

      if (!String(updates.fullName).trim()) {

        return res.status(400).json({
          message: "Full name is required.",
        });

      }

      updates.fullName =
        String(updates.fullName).trim();
    }


    const elder =
      await Elder.findOneAndUpdate(

        {
          _id: req.params.id,

          caregiver: req.user._id,
        },

        {
          $set: updates,
        },

        {
          new: true,

          runValidators: true,
        }

      );


    if (!elder) {

      return res.status(404).json({
        message: "Elder not found",
      });

    }


    return res.status(200).json(elder);

  } catch (error) {

    console.error(
      "UPDATE ELDER ERROR:",
      error
    );


    if (error.name === "CastError") {

      return res.status(400).json({
        message: "Invalid elder ID.",
      });

    }


    if (error.name === "ValidationError") {

      return res.status(400).json({
        message: error.message,
      });

    }


    return res.status(500).json({
      message: error.message,
    });
  }
};


// ===============================
// DELETE ELDER
// ===============================

export const deleteElder = async (req, res) => {
  try {

    if (!assertCaregiver(req, res)) return;


    const elder =
      await Elder.findOneAndDelete({

        _id: req.params.id,

        caregiver: req.user._id,

      });


    if (!elder) {

      return res.status(404).json({
        message: "Elder not found",
      });

    }


    return res.status(200).json({

      message:
        "Elder profile deleted successfully.",

      elderId: elder._id,

    });

  } catch (error) {

    console.error(
      "DELETE ELDER ERROR:",
      error
    );


    if (error.name === "CastError") {

      return res.status(400).json({
        message: "Invalid elder ID.",
      });

    }


    return res.status(500).json({
      message: error.message,
    });
  }
};


// ===============================
// COVERAGE FUNCTIONS
// ===============================

export const getActiveCoverageForCaregiver =
  async (
    caregiverId,
    at = new Date()
  ) => {

    const dayStart =
      startOfDay(at);

    const dayEnd =
      endOfDay(at);


    return populateCoverage(

      ShiftCoverage.find({

        coveringCaregiver:
          caregiverId,

        startAt: {
          $lte: dayEnd,
        },

        endAt: {
          $gte: dayStart,
        },

      })

    ).lean();
  };


// Used by elder list/dashboard
export const getUpcomingCoverageForCaregiver =
  async (
    caregiverId,
    at = new Date()
  ) => {

    return populateCoverage(

      ShiftCoverage.find({

        coveringCaregiver:
          caregiverId,

        endAt: {
          $gte: at,
        },

      })

    ).lean();
  };


// Check whether caregiver is currently
// covering a specific elder
export const isCoveringElder =
  async (
    caregiverId,
    elderId,
    at = new Date()
  ) => {

    const row =
      await ShiftCoverage.findOne({

        coveringCaregiver:
          caregiverId,

        elder: elderId,

        startAt: {
          $lte: at,
        },

        endAt: {
          $gte: at,
        },

      }).lean();


    return row;
  };


// Create coverage after an accepted swap
export const createCoverageForAcceptedSwap =
  async ({
    swapRequestId,
    requesterId,
    receiverId,
    slotStartAt,
    slotEndAt,
    Elder: ElderModel,
  }) => {

    const elders =
      await ElderModel
        .find({
          caregiver: requesterId,
        })
        .select("_id");


    if (!elders.length) {
      return [];
    }


    const rows =
      elders.map((elder) => ({

        swapRequest:
          swapRequestId,

        elder:
          elder._id,

        originalCaregiver:
          requesterId,

        coveringCaregiver:
          receiverId,

        startAt:
          slotStartAt,

        endAt:
          slotEndAt,

      }));


    return Promise.all(

      rows.map((row) =>

        ShiftCoverage.findOneAndUpdate(

          {
            swapRequest:
              row.swapRequest,

            elder:
              row.elder,
          },

          {
            $setOnInsert:
              row,
          },

          {
            upsert: true,

            new: true,

            setDefaultsOnInsert:
              true,
          }

        )

      )

    );
  };