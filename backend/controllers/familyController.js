import Elder from "../models/elder.js";

export const connectToElder = async (req, res) => {
  try {

    if (req.user.role !== "family_member") {
      console.log("ROLE CHECK FAILED");

      return res.status(403).json({
        message: `Access denied. Backend role = ${JSON.stringify(req.user.role)}`,
      });
    }

    console.log("ROLE CHECK PASSED");

    const { elderId, relation } = req.body;

    if (!elderId) {
      return res.status(400).json({
        message: "Elder ID is required.",
      });
    }

    if (!relation) {
      return res.status(400).json({
        message: "Please specify your relation to this elder.",
      });
    }

    console.log("Searching for elder:", elderId);

    const elder = await Elder.findOne({ elderID: elderId });

    if (!elder) {
      console.log("ELDER NOT FOUND");

      return res.status(404).json({
        message: "Invalid Elder ID.",
      });
    }

    console.log("ELDER FOUND:", elder._id.toString());

    const alreadyConnected = elder.familyMembers.some(
      (member) => member.user.toString() === req.user._id.toString()
    );

    if (alreadyConnected) {
      return res.status(400).json({
        message: "You are already connected to this elder.",
      });
    }

    elder.familyMembers.push({
      user: req.user._id,
      relation,
    });

    await elder.save();

    console.log("FAMILY MEMBER CONNECTED SUCCESSFULLY");

    return res.status(200).json({
      message: "Connected successfully.",
      elder,
    });

  } catch (error) {
    console.error("CONNECT TO ELDER ERROR:", error);

    return res.status(500).json({
      message: error.message,
    });
  }
};

export const getMyElders = async (req, res) => {
  try {
    if (req.user.role !== "family_member") {
      return res.status(403).json({
        message: "Access denied.",
      });
    }

    const elders = await Elder.find({
      "familyMembers.user": req.user.id,
    }).populate("caregiver", "name email phone");

    res.status(200).json(elders);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};