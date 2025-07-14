// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract PreferencesRegistry {
    struct Preferences {
        uint8 minAge;
        uint8 maxAge;
        uint8[3] acceptedGenders;
        uint8 location;
        uint8 occupation;
        uint8 hobby;
        bool exists;
    }

    mapping(address => Preferences) private preferences;

    event PreferencesSet(address indexed user);

    // Set or update preferences
    function setPreferences(
        uint8 minAge,
        uint8 maxAge,
        uint8[3] calldata acceptedGenders,
        uint8 location,
        uint8 occupation,
        uint8 hobby
    ) external {
        require(minAge <= maxAge, "Invalid age range");

        preferences[msg.sender] = Preferences({
            minAge: minAge,
            maxAge: maxAge,
            acceptedGenders: acceptedGenders,
            location: location,
            occupation: occupation,
            hobby: hobby,
            exists: true
        });

        emit PreferencesSet(msg.sender);
    }

    // Read preferences for a user
    function getPreferences(address user)
        external
        view
        returns (
            uint8 minAge,
            uint8 maxAge,
            uint8[3] memory acceptedGenders,
            uint8 location,
            uint8 occupation,
            uint8 hobby,
            bool exists
        )
    {
        Preferences memory prefs = preferences[user];
        return (
            prefs.minAge,
            prefs.maxAge,
            prefs.acceptedGenders,
            prefs.location,
            prefs.occupation,
            prefs.hobby,
            prefs.exists
        );
    }
}
