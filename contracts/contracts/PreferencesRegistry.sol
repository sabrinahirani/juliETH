// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract PreferencesRegistry {

    struct Preferences {
        uint8 minAge;
        uint8 maxAge;
        uint8[3] acceptedGenders;
        uint8 desiredLocation;
        uint8 desiredOccupation;
        uint8 desiredHobby;
        bool exists; // to determine whether or not preferences were actually registered
    }
    mapping(address => Preferences) private preferences;

    event PreferencesRegistered(address indexed user);

    function setPreferences(uint8 minAge, uint8 maxAge, uint8[3] calldata acceptedGenders, uint8 desiredLocation, uint8 desiredOccupation, uint8 desiredHobby) public {
        require(minAge <= maxAge, "Invalid Age Range");

        preferences[msg.sender] = Preferences({
            minAge: minAge,
            maxAge: maxAge,
            acceptedGenders: acceptedGenders,
            desiredLocation: desiredLocation,
            desiredOccupation: desiredOccupation,
            desiredHobby: desiredHobby,
            exists: true
        });

        emit PreferencesRegistered(msg.sender);
    }

    function getPreferences(address user) public view returns (uint8 minAge, uint8 maxAge, uint8[3] memory acceptedGenders, uint8 desiredLocation, uint8 desiredOccupation, uint8 desiredHobby, bool exists) {
        Preferences memory preference = preferences[user];
        return (
            preference.minAge,
            preference.maxAge,
            preference.acceptedGenders,
            preference.desiredLocation,
            preference.desiredOccupation,
            preference.desiredHobby,
            preference.exists
        );
    }
}
