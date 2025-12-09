#pragma once
#include <cstdarg>
namespace Eloquent {
    namespace ML {
        namespace Port {
            class DecisionTree {
                public:
                    /**
                    * Predict class for features vector
                    */
                    int predict(float *x) {
                        if (x[2] <= 0.20166586339473724) {
                            if (x[0] <= 1.0666682720184326) {
                                return 0;
                            }

                            else {
                                return 1;
                            }
                        }

                        else {
                            if (x[3] <= 0.052147338166832924) {
                                if (x[2] <= 0.5515759289264679) {
                                    return 2;
                                }

                                else {
                                    return 3;
                                }
                            }

                            else {
                                if (x[3] <= 0.13149408996105194) {
                                    return 3;
                                }

                                else {
                                    return 3;
                                }
                            }
                        }
                    }

                    /**
                    * Predict readable class name
                    */
                    const char* predictLabel(float *x) {
                        return idxToLabel(predict(x));
                    }

                    /**
                    * Convert class idx to readable name
                    */
                    const char* idxToLabel(uint8_t classIdx) {
                        switch (classIdx) {
                            case 0:
                            return "AllClear";
                            case 1:
                            return "Watch";
                            case 2:
                            return "Caution";
                            case 3:
                            return "Warning";
                            case 4:
                            return "Emergency";
                            default:
                            return "Houston we have a problem";
                        }
                    }

                protected:
                };
            }
        }
    }